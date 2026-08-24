import sys
from datetime import datetime
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame
from pyspark.sql import functions as F
from pyspark.sql.functions import array, col, when, struct, udf, regexp_replace, concat_ws
from pyspark.sql.types import StructType, StructField, StringType, BooleanType, IntegerType, ArrayType, DoubleType, DateType, NullType

args = getResolvedOptions(sys.argv, ["JOB_NAME"])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args["JOB_NAME"], args)
logger = glueContext.get_logger()

# Script generated for node Vote History
VoteHistory_node1702883753889 = glueContext.create_dynamic_frame.from_options(
    format_options={"multiline": False},
    connection_type="s3",
    format="json",
    connection_options={
        "paths": ["s3://flavoter/input_voter_all/voteHistory.json"],
        "recurse": False,
    },
    transformation_ctx="VoteHistory_node1702883753889",
)

# Script generated for node Voter Roll
VoterRoll_node1702883679235 = glueContext.create_dynamic_frame.from_options(
    format_options={"multiline": False},
    connection_type="s3",
    format="json",
    connection_options={
        "paths": ["s3://flavoter/input_voter_all/voterRoll.json"],
        "recurse": False,
    },
    transformation_ctx="VoterRoll_node1702883679235",
)

# Script generated for node GeoLocations
GeoLocations_node1702883313364 = glueContext.create_dynamic_frame.from_options(
    format_options={"multiline": False},
    connection_type="s3",
    format="json",
    connection_options={
        "paths": ["s3://flavoter/input_voter_all/geoLocations.json"],
        "recurse": False,
    },
    transformation_ctx="GeoLocations_node1702883313364",
)

# Resolve choice for the specified fields
GeoLocations_node1702883313364 = GeoLocations_node1702883313364.resolveChoice(
    specs=[
        ('tigerlineid', 'cast:string'),
        ('countyfp', 'cast:string'),
        ('tract', 'cast:string'),
        ('block', 'cast:string')
    ]
)

# Script generated for node Renamed keys for Join
RenamedkeysforJoin_node1702884001897 = ApplyMapping.apply(
    frame=VoteHistory_node1702883753889,
    mappings=[
        ("_id.$oid", "string", "right__id.$oid", "string"),
        ("countyvotedin", "string", "countyVotedIn", "string"),
        ("voter_id", "string", "right_voter_id", "string"),
        ("electiondate", "string", "electionDate", "string"),
        ("electiontype", "string", "electionType", "string"),
        ("votingmethod", "string", "votingMethod", "string"),
    ],
    transformation_ctx="RenamedkeysforJoin_node1702884001897",
)

# Join between VoterRoll and VoteHistory
VoterRoll_node1702883679235DF = VoterRoll_node1702883679235.toDF()
RenamedkeysforJoin_node1702884001897DF = RenamedkeysforJoin_node1702884001897.toDF()
Join_node1702883866551DF = VoterRoll_node1702883679235DF.join(
    RenamedkeysforJoin_node1702884001897DF,
    VoterRoll_node1702883679235DF["voter_id"] == RenamedkeysforJoin_node1702884001897DF["right_voter_id"],
    "left"
)

# Group by voter_id and aggregate votes into a list
votes_agg = Join_node1702883866551DF.groupBy("voter_id").agg(
    F.collect_list(
        F.struct(
            F.col("countyVotedIn"),
            F.col("electionDate"),
            F.col("electionType"),
            F.col("votingMethod")
        )
    ).alias("pastVotes")
)

# Define the UDF for cleaning voteHistory
def clean_voting_history(voting_history):
    if voting_history and all(field is None for field in voting_history[0]):
        return None
    return voting_history

clean_voting_history_udf = udf(clean_voting_history, ArrayType(StructType([
    StructField("countyVotedIn", StringType(), True),
    StructField("electionDate", StringType(), True),
    StructField("electionType", StringType(), True),
    StructField("votingMethod", StringType(), True)
])))

# Join the aggregated votes back to the original VoterRoll dataframe
voter_roll_with_votes_df = VoterRoll_node1702883679235DF.join(
    votes_agg,
    VoterRoll_node1702883679235DF["voter_id"] == votes_agg["voter_id"],
    "left"
).drop("_id")

# Concatenate first name, middle name, and last name with space as a separator
voter_roll_with_votes_df = voter_roll_with_votes_df.withColumn(
    "fullname",
    concat_ws(" ", 
              col("profile.firstname"), 
              col("profile.middlename"), 
              col("profile.lastname"),
              col("profile.suffix"))
)

# Apply the UDF to clean up votingHistory
voter_roll_with_votes_df = voter_roll_with_votes_df.withColumn(
    "pastVotes", 
    clean_voting_history_udf("pastVotes")
)

# Script generated for node Drop Duplicates
DropDuplicates_node1702883422540DF = GeoLocations_node1702883313364.toDF().dropDuplicates(
    ["streetinput", "cityinput", "zipinput"]
)

# Create a condition to check if address data are null
condition = (
    (voter_roll_with_votes_df["address.residenceaddresslineone"] == DropDuplicates_node1702883422540DF["streetinput"]) &
    (voter_roll_with_votes_df["address.residencecity"] == DropDuplicates_node1702883422540DF["cityinput"]) &
    (voter_roll_with_votes_df["address.residencezipcode"] == DropDuplicates_node1702883422540DF["zipinput"]) &
    (voter_roll_with_votes_df["address.residenceaddresslineone"].isNotNull()) &
    (voter_roll_with_votes_df["address.residencecity"].isNotNull()) &
    (voter_roll_with_votes_df["address.residencezipcode"].isNotNull()) &
    (DropDuplicates_node1702883422540DF["streetinput"].isNotNull()) &
    (DropDuplicates_node1702883422540DF["cityinput"].isNotNull()) &
    (DropDuplicates_node1702883422540DF["zipinput"].isNotNull())
)

# Perform the join with the GeoLocations dataframe
joined_with_geo_df = voter_roll_with_votes_df.join(
    DropDuplicates_node1702883422540DF,
    condition,
    "left"
)

# Replace null values in address.residencestate with 'Florida'
voter_roll_with_votes_df = voter_roll_with_votes_df.withColumn(
    "address.residencestate", 
    F.when(F.col("address.residencestate").isNull(), F.lit("Florida"))
     .otherwise(F.col("address.residencestate"))
)

#sample_data = joined_with_geo_df.limit(10).toPandas().to_dict(orient='records')  
#logger.info(f"Sample transformed data: {sample_data}")

# Extract longitude and latitude from coordinates
joined_with_geo_df = joined_with_geo_df.withColumn(
    "longitude", col("coordinates").getItem(0)["double"]
).withColumn(
    "latitude", col("coordinates").getItem(1)["double"]
)

# Create geolocation struct conditionally
joined_with_geo_df = joined_with_geo_df.withColumn(
    "geoPoint", 
    when(col("match") == True, struct(
        regexp_replace(col("_id").cast("string"), "\\{|\\}", "").alias("g_id"),
        col("match").alias("matchFound"),
        col("matchtype").alias("matchType"),
        col("parsed").alias("parsedAddress"),
        col("tigerlineid").alias("tigerLineId"),
        col("side").alias("tigerSide"),
        col("countyfp").alias("countyfpCode"),
        col("tract").alias("tractCode"),
        col("block").alias("blockCode"),
        array(col("longitude"), col("latitude")).alias("coordinates")
    )).otherwise(None)
)

# Now drop the original geo columns
joined_with_geo_df = joined_with_geo_df.drop("streetinput", "cityinput", "zipinput", "coordinates", "match", "matchtype", "parsed", "tigerlineid", "side", "countyfp", "tract", "block", "g_id")

#sample_data = joined_with_geo_df.limit(10).toPandas().to_dict(orient='records')  
#logger.info(f"Sample transformed data after adding geoPoint struct: {sample_data}")

# Apply final schema transformation
ChangeSchema_node1702884832172 = ApplyMapping.apply(
    frame=DynamicFrame.fromDF(joined_with_geo_df, glueContext, "ChangedSchemaDF"),
    mappings=[
        ("voter_id", "string", "voter_id", "string"),
        ("politicalparty", "string", "politicalParty", "string"),
        ("voterregistrationdate", "string", "voterRegistrationDate", "string"),
        ("voterstatus", "string", "voterStatus", "string"),
        (
            "requestedpublicrecordsexemption",
            "string",
            "exemptionRequested",
            "string",
        ),
        ("fullname", "string", "profile.fullName", "string"),
        ("profile.firstname", "string", "profile.firstName", "string"),
        ("profile.middlename", "string", "profile.middleName", "string"),
        ("profile.lastname", "string", "profile.lastName", "string"),
        ("profile.suffix", "string", "profile.suffix", "string"),
        ("profile.birthdate", "string", "profile.birthDate", "string"),
        ("profile.gender", "string", "profile.gender", "string"),
        ("profile.race", "int", "profile.race", "string"),
        ("contact.phonearea", "string", "contact.phoneArea", "string"),
        ("contact.phonenumber", "string", "contact.phoneNumber", "string"),
        ("contact.phoneextension", "null", "contact.phoneExtension", "string"),
        ("contact.email", "string", "contact.email", "string"),
        ("district.countycode", "string", "district.countyCode", "string"),
        (
            "district.congressionaldistrict",
            "string",
            "district.congressionalDistrict",
            "string",
        ),
        ("district.housedistrict", "string", "district.houseDistrict", "string"),
        ("district.senatedistrict", "string", "district.senateDistrict", "string"),
        (
            "district.countycommissiondistrict",
            "string",
            "district.countyCommissionDistrict",
            "string",
        ),
        (
            "district.schoolboarddistrict",
            "string",
            "district.schoolBoardDistrict",
            "string",
        ),
        ("district.precinct", "string", "district.precinct", "string"),
        ("district.precinctgroup", "string", "district.precinctGroup", "string"),
        ("district.precinctsplit", "string", "district.precinctSplit", "string"),
        ("district.precinctsuffix", "null", "district.precinctSuffix", "string"),
        (
            "address.residenceaddresslineone",
            "string",
            "address.residenceStreet",
            "string",
        ),
        (
            "address.residenceaddresslinetwo",
            "string",
            "address.residenceStreetLineTwo",
            "string",
        ),
        ("address.residencecity", "string", "address.residenceCity", "string"),
        ("address.residencestate", "string", "address.residenceState", "string"),
        ("address.residencezipcode", "string", "address.residenceZipcode", "string"),
        (
            "address.mailaddresslineone",
            "string",
            "address.mailStreet",
            "string",
        ),
        ("address.mailaddresslinetwo", "null", "address.mailStreetLineTwo", "string"),
        (
            "address.mailaddresslinethree",
            "null",
            "address.mailStreetLineThree",
            "string",
        ),
        ("address.mailcity", "string", "address.mailCity", "string"),
        ("address.mailstate", "string", "address.mailState", "string"),
        ("address.mailzipcode", "string", "address.mailZipcode", "string"),
        ("address.mailcountry", "string", "address.mailCountry", "string"),
        ("geoPoint.g_id", "string", "geoPoint.g_id", "string"),
        ("geoPoint.matchFound", "boolean", "geoPoint.matchFound", "boolean"),
        ("geoPoint.matchType", "string", "geoPoint.matchType", "string"),
        ("geoPoint.parsedAddress", "string", "geoPoint.parsedAddress", "string"),
        ("geoPoint.tigerLineId", "string", "geoPoint.tigerLineId", "string"),
        ("geoPoint.tigerSide", "string", "geoPoint.tigerSide", "string"),
        ("geoPoint.countyfpCode", "string", "geoPoint.countyfpCode", "string"),
        ("geoPoint.tractCode", "string", "geoPoint.tractCode", "string"),
        ("geoPoint.blockCode", "string", "geoPoint.blockCode", "string"),
        ("geoPoint.coordinates", "array", "geoPoint.coordinates", "array"),
        ("pastVotes", "array", "pastVotes", "array"),
    ],
    transformation_ctx="ChangeSchema_node1702884832172",
)

#sample_data = ChangeSchema_node1702884832172.toDF().limit(10).toPandas().to_dict(orient='records')  
#logger.info(f"Sample final data: {sample_data}")

# Script generated for node Amazon S3
final_df = ChangeSchema_node1702884832172.toDF().repartition(3)
AmazonS3_node1702884884316 = glueContext.write_dynamic_frame.from_options(
    frame=DynamicFrame.fromDF(final_df, glueContext, "final_dynamic_frame"),
    connection_type="s3",
    format="json",
    connection_options={
        "path": "s3://flavoter/output_voter_all/",
        "compression": "gzip",
        "partitionKeys": [],
    },
    transformation_ctx="AmazonS3_node1702884884316",
)

job.commit()