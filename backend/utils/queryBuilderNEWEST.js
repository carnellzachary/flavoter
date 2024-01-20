// Developed with help from https://github.com/rpopuc/nl-mongodb-query-builder
class QueryBuilder {

    static async handle(question, errorFeedback) {
        const fs = require('fs');
        const { OpenAI } = require("openai");

        const system_instructions = "You are a Mongo expert that carefully responds to natural language requests with logically constructed queries for a collection named 'voters' in a MongoDB 6.0.4 database. Each document represents data for an individual voter. The collection’s schema and its attributes are shown in the code block below, with inline comments that detail specific codes used by certain fields:\n\n```javascript\n  {\n    voter_id: {\n      type: String,\n      required: true\n    },\n    voterRegistrationDate: Date, /* Already formatted as an ISO date */\n    politicalParty: String, /* Codes: BPP=Boricua Party, CPP=Coalition With a Purpose Party, CSV=Conservative Party, CPF=Constitution Party, DEM=Democratic Party, ECO=Ecology Party, FFP=Florida Forward Party, GRE=Green Party, IND=Independent Party, LPF=Libertarian Party, NLP=No Labels Party, NPA=No Party Affiliation, PSL=Party for Socialism and Liberation, PEO=People’s Party, REP=Republican Party  */\n    voterStatus: String, /* Codes: ACT=Active, INA=Inactive */\n    exemptionRequested: String, /* Codes: Y=Yes, N=No */\n    profile: {\n      fullName: String,\n      firstName: String,\n      middleName: String,\n      lastName: String,\n      suffix: String,\n      birthDate: Date, /* Already formatted as an ISO date */\n      gender: String, /* Codes: F=Female, M=Male, U=Unknown */\n      race: String /* Codes: 1=American Indian or Alaskan Native, 2=Asian Or Pacific Islander, 3=Black, Not Hispanic, 4=Hispanic, 5=White, Not Hispanic, 6=Other, 7=Multi-racial, 9=Unknown */\n    },\n    contact: {\n      phoneArea: String,\n      phoneNumber: String,\n      phoneExtension: String,\n      email: String\n    },\n    district: {\n      countyCode: String,  /* Codes: ALA=Alachua, HAM=Hamilton, OKE=Okeechobee, BAK=Baker, HAR=Hardee, ORA=Orange, BAY=Bay, HEN=Hendry, OSC=Osceola, BRA=Bradford, HER=Hernando, PAL=Palm Beach, BRE=Brevard, HIG=Highlands, PAS=Pasco, BRO=Broward, HIL=Hillsborough, PIN=Pinellas, CAL=Calhoun, HOL=Holmes, POL=Polk, CHA=Charlotte, IND=Indian River, PUT=Putnam, CIT=Citrus, JAC=Jackson, SAN=Santa Rosa, CLA=Clay, JEF=Jefferson, SAR=Sarasota, CLL=Collier, LAF=Lafayette, SEM=Seminole, CLM=Columbia, LAK=Lake, STJ=St. Johns, DAD=Miami-Dade, LEE=Lee, STL=St. Lucie, DES=Desoto, LEO=Leon, SUM=Sumter, DIX=Dixie, LEV=Levy, SUW=Suwannee, DUV=Duval, LIB=Liberty, TAY=Taylor, ESC=Escambia, MAD=Madison, UNI=Union, FLA=Flagler, MAN=Manatee, VOL=Volusia, FRA=Franklin, MRN=Marion, WAK=Wakulla, GAD=Gadsden, MRT=Martin, WAL=Walton, GIL=Gilchrist, MON=Monroe, WAS=Washington, GLA=Glades, NAS=Nassau, GUL=Gulf, OKA=Okaloosa */\n      congressionalDistrict: String,\n      houseDistrict: String,\n      senateDistrict: String,\n      countyCommissionDistrict: String,\n      schoolBoardDistrict: String,\n      precinct: String,\n      precinctGroup: String,\n      precinctSplit: String,\n      precinctSuffix: String\n    },\n    address: {\n      residenceStreet: String,\n      residenceStreetLineTwo: String,\n      residenceCity: String,\n      residenceState: String,\n      residenceZipCode: String,\n      mailStreet: String,\n      mailStreetLineTwo: String,\n      mailStreetLineThree: String,\n      mailCity: String,\n      mailState: String,\n      mailZipcode: String,\n      mailCountry: String\n    },\n    geoPoint: {\n      /* GeoJSON Point for residence address */\n      g_id: mongoose.Schema.Types.ObjectId,\n      matchFound: Boolean,\n      matchType: String,\n      parsedAddress: String,\n      tigerLineId: String,\n      tigerSide: String,\n      countyfpCode: String,\n      tractCode: String,\n      blockCode: String,\n      type: {\n        type: String,\n        enum: ['Point']\n      },\n      coordinates: {\n        type: [Number],\n        index: '2dsphere'\n      }\n    },\n    /* pastVotes is an array that may contain multiple objects each representing individual votes */\n    pastVotes: [{\n      countyVotedIn: String,  /* Codes: ALA=Alachua, HAM=Hamilton, OKE=Okeechobee, BAK=Baker, HAR=Hardee, ORA=Orange, BAY=Bay, HEN=Hendry, OSC=Osceola, BRA=Bradford, HER=Hernando, PAL=Palm Beach, BRE=Brevard, HIG=Highlands, PAS=Pasco, BRO=Broward, HIL=Hillsborough, PIN=Pinellas, CAL=Calhoun, HOL=Holmes, POL=Polk, CHA=Charlotte, IND=Indian River, PUT=Putnam, CIT=Citrus, JAC=Jackson, SAN=Santa Rosa, CLA=Clay, JEF=Jefferson, SAR=Sarasota, CLL=Collier, LAF=Lafayette, SEM=Seminole, CLM=Columbia, LAK=Lake, STJ=St. Johns, DAD=Miami-Dade, LEE=Lee, STL=St. Lucie, DES=Desoto, LEO=Leon, SUM=Sumter, DIX=Dixie, LEV=Levy, SUW=Suwannee, DUV=Duval, LIB=Liberty, TAY=Taylor, ESC=Escambia, MAD=Madison, UNI=Union, FLA=Flagler, MAN=Manatee, VOL=Volusia, FRA=Franklin, MRN=Marion, WAK=Wakulla, GAD=Gadsden, MRT=Martin, WAL=Walton, GIL=Gilchrist, MON=Monroe, WAS=Washington, GLA=Glades, NAS=Nassau, GUL=Gulf, OKA=Okaloosa */\n      electionDate: Date, /* Already formatted as an ISO date */\n      electionType: String, /* Codes: PPP=Presidential Preference Primary Election, PRI=Primary Election, RUN=Runoff Election, GEN=General Election, OTH=Other Election */\n      votingMethod: String /* Codes: A=Voted by Mail, B=Vote-by-Mail Ballot Not Counted, E=Voted Early, N=Did Not Vote, P=Provisional Ballot Not Counted, Y=Voted at Polls */\n    }]\n  }\n\n```\n\nFor each request, do not respond with any introduction or explanation. Only respond with an aggregation pipeline that would effectively execute within the ‘Model.aggregate()’ Mongoose method without causing any errors. So to be clear, here’s where your response will be executed: Model.aggregate(<YOUR RESPONSE WILL BE EXECUTED HERE>) \n\nIt's crucial that the aggregation pipeline is JSON serializable. \n\nUnderstand what has been said. When you understand, remain idle until you receive a natural language request.";
        const messages = [
            { role: 'system', content: system_instructions },
        ];

        // If there is error feedback, add it to the messages array
        if (errorFeedback) {
            messages.push({
                role: 'user',
                content: errorFeedback
            });

           // console.log(errorFeedback);
        } else {
            // Question already included in error feedback if error
            messages.push({ role: 'user', content: question + "\n\nPlease provide the pipeline in a JSON serializable format." });
        }

        const functions = [
            {
                "name": "generate_mongo_query",
                "description": "Generate a logical aggregation query for a MongoDB 6.0.4 database",
                "parameters": {
                      "type": "object",
                      "properties": {
                          "query": {
                              "type": "string",
                              "description": "Mongo aggregation pipeline query to execute within the Model.aggregate() Mongoose method",
                          },
                          "answer": {
                            "type": "string",
                            "description": "A natural language statement that incorparates the query result into a statement that leaves room for a fill-in-the-blank placeholder formatted as {data_result}. The placeholder MUST ALWAYS be written out as {data_result}, not {total}, {percentage}, or anything else.",
                          },
                          "titles": {
                              "type": "object",
                              "description": "A map of field names to titles to present the results",
                              "properties": {
                                  "field": {
                                      "type": "string",
                                  },
                                  "title": {
                                      "type": "string",
                                  },
                                  "type": {
                                      "type": "string",
                                  }
                              },
                          },
                      },
                      "required": ["query", "answer", "titles"],
                },
            }
        ];

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        return openai.chat.completions.create({
            // model: "gpt-3.5-turbo",
            model: "gpt-3.5-turbo-1106",
            temperature: 0.01,
            max_tokens: 1000,
            response_format: {"type": "json_object"},
            messages,
            functions
        }).then(response => {
            // const textResponse = response.choices[0].message.function_call.arguments;
            const textResponse = response.choices[0].message;

            return textResponse
        }).catch(error => console.log(error));
    }
}

module.exports = QueryBuilder;

