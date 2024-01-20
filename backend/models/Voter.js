const mongoose = require('mongoose');

// Add enums, requireds, trims, maxlengths, defaults, etc
const VoterSchema = new mongoose.Schema(
  {
    voter_id: {
      type: String,
      required: true
    },
    voterRegistrationDate: Date, /* ISO date format*/
    politicalParty: String, /* BPP=Boricua Party, CPP=Coalition With a Purpose Party, CSV=Conservative Party, CPF=Constitution Party, DEM=Democratic Party, ECO=Ecology Party, FFP=Florida Forward Party, GRE=Green Party, IND=Independent Party, LPF=Libertarian Party, NLP=No Labels Party, NPA=No Party Affiliation, PSL=Party for Socialism and Liberation, PEO=People’s Party, REP=Republican Party  */
    voterStatus: String, /* ACT=Active, INA=Inactive */
    exemptionRequested: String, /* Y=Yes, N=No */
    profile: {
      fullName: String,
      firstName: String,
      middleName: String,
      lastName: String,
      suffix: String,
      birthDate: Date, /* ISO date format */
      gender: String, /* Codes: F=Female, M=Male, U=Unknown */
      race: String /* Codes: 1=American Indian or Alaskan Native, 2=Asian Or Pacific Islander, 3=Black, Not Hispanic, 4=Hispanic, 5=White, Not Hispanic, 6=Other, 7=Multi-racial, 9=Unknown */
    },
    contact: {
      phoneArea: String,
      phoneNumber: String,
      phoneExtension: String,
      email: String
    },
    district: {
      countyCode: String, /* Refer to the County Code Dictionary near the bottom  */
      congressionalDistrict: String,
      houseDistrict: String,
      senateDistrict: String,
      countyCommissionDistrict: String,
      schoolBoardDistrict: String,
      precinct: String,
      precinctGroup: String,
      precinctSplit: String,
      precinctSuffix: String
    },
    address: {
      residenceStreet: String,
      residenceStreetLineTwo: String,
      residenceCity: String,
      residenceState: String,
      residenceZipCode: String,
      mailStreet: String,
      mailStreetLineTwo: String,
      mailStreetLineThree: String,
      mailCity: String,
      mailState: String,
      mailZipcode: String,
      mailCountry: String
    },
    geoPoint: {
      /* GeoJSON Point for residence address */
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
      g_id: mongoose.Schema.Types.ObjectId,
      matchFound: Boolean,
      matchType: String,
      parsedAddress: String,
      tigerLineId: String,
      tigerSide: String,
      countyfpCode: String,
      tractCode: String,
      blockCode: String
    },
    pastVotes: [{
      countyVotedIn: String, /* Refer to the County Code Dictionary near the bottom  */
      electionDate: Date, /* ISO date format */
      electionType: String, /* Codes: PPP=Presidential Preference Primary Election, PRI=Primary Election, RUN=Runoff Election, GEN=General Election, OTH=Other Election */
      votingMethod: String /* Codes: A=Voted by Mail, B=Vote-by-Mail Ballot Not Counted, E=Voted Early, N=Did Not Vote, P=Provisional Ballot Not Counted, Y=Voted at Polls */
    }]
  });

  /* County Code Dictionary: ALA=Alachua, HAM=Hamilton, OKE=Okeechobee, BAK=Baker, HAR=Hardee, ORA=Orange, BAY=Bay, HEN=Hendry, OSC=Osceola, BRA=Bradford, HER=Hernando, PAL=Palm Beach, BRE=Brevard, HIG=Highlands, PAS=Pasco, BRO=Broward, HIL=Hillsborough, PIN=Pinellas, CAL=Calhoun, HOL=Holmes, POL=Polk, CHA=Charlotte, IND=Indian River, PUT=Putnam, CIT=Citrus, JAC=Jackson, SAN=Santa Rosa, CLA=Clay, JEF=Jefferson, SAR=Sarasota, CLL=Collier, LAF=Lafayette, SEM=Seminole, CLM=Columbia, LAK=Lake, STJ=St. Johns, DAD=Miami-Dade, LEE=Lee, STL=St. Lucie, DES=Desoto, LEO=Leon, SUM=Sumter, DIX=Dixie, LEV=Levy, SUW=Suwannee, DUV=Duval, LIB=Liberty, TAY=Taylor, ESC=Escambia, MAD=Madison, UNI=Union, FLA=Flagler, MAN=Manatee, VOL=Volusia, FRA=Franklin, MRN=Marion, WAK=Wakulla, GAD=Gadsden, MRT=Martin, WAL=Walton, GIL=Gilchrist, MON=Monroe, WAS=Washington, GLA=Glades, NAS=Nassau, GUL=Gulf, OKA=Okaloosa */

module.exports = mongoose.model('Voter', VoterSchema);