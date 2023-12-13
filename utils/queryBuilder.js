class QueryBuilder {

    static async handle(question) {
        const { OpenAI } = require("openai");

        const messages = [
            { role: 'system', content: 'You are an expert in constructing MongoDB queries. Here is an example document from my MonogDB collection of voter data (Each document represents an individual voter): {"profile":{"suffix":null,"firstName":"John","middleName":null,"lastName":"Smith","dob":"2049-01-25T05:00:00.000Z","gender":"M","race":3},"address":{"addr1":"1002 Oxford Cir","addr2":null,"city":"Gainesville","state":null,"zip":"326075748","mailAddr1":"7257 NW 4Th Blvd #273","mailAddr2":null,"mailAddr3":null,"mailCity":"Gainesville","mailState":"FL","mailZip":"32607","mailCountry":null},"contact":{"phoneArea":null,"phoneNumber":null,"phoneExtension":null,"email":null},"district":{"countyCode":"ALA","congressionalDistrict":"3","houseDistrict":"21","senateDistrict":"9","schoolBoardDistrict":"5","precinct":"52","precinctGroup":"0","precinctSplit":"52.4","precinctSuffix":null},"geoloc":{"matching":"Match","exactness":"Non_Exact","outputAddress":"1002 OXFORD CT, GAINESVILLE, FL, 32607","tigerId":"6820086","tigerIdSide":"R","countyCode":"1","tractCode":"2218","blockCode":"1019","streetInput":"1002 Oxford Cir","cityInput":"Gainesville","zipInput":"326075748","type":"Point","coordinates":[-82.413749156,29.644428071]},"_id":"65761c9d4a1d1e81cab4decf","party":"DEM","exempt":"N","votes":[{"_id":"653dc9de7e849fdc88d6a59e","countyCode":"ALA","electionDate":"2020-11-03","electionType":"GEN","historyCode":"A"},{"_id":"653dca377e849fdc88da9b79","countyCode":"ALA","electionDate":"2008-11-04","electionType":"GEN","historyCode":"Y"}],"voterStatus":"ACT","voter_id":"100450405”}\n\nBased on your analysis of my document schema, I want you to carefully intrepret and logically translate natural language questions, like "What percent of voters who live in Gainesville are registered with the Republican party?" or "How many voters in Alachua County were born in the year 2000?", into a Mongoose query that uses the aggregate() method on my “Voter” model (Please do not use any other method). Your responses must contain ONLY the code, minified to one line with no formatting, and nothing else: Just the code, with no explanation. Also, please put double quote marks around MongoDB pipeline operators.' },
            { role: 'user', content: question }
        ];

        const functions = [
            {
                "name": "execute_mongo_query",
                "description": "Execute an aggregate mongo query pipeline and shows the result",
                "parameters": {
                      "type": "object",
                      "properties": {
                          "query": {
                              "type": "string",
                              "description": "Mongo query to execute",
                          },
                          "collection": {
                              "type": "string",
                              "description": "The collection to run the query",
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
                      "required": ["query", "collection", "titles"],
                },
            }
        ];

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        return openai.chat.completions.create({
            // model: "gpt-3.5-turbo",
            model: "gpt-3.5-turbo-0613",
            temperature: 0,
            max_tokens: 1000,
            messages,
            functions
        }).then(response => {
            const textResponse = response.choices[0].message.function_call.arguments;
            return textResponse
        }).catch(error => console.log(error));
    }
}

module.exports = QueryBuilder;