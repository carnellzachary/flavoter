// Developed with help from https://github.com/rpopuc/nl-mongodb-query-builder
class QueryBuilder {

    static async handle(question, errorFeedback) {
        const { OpenAI } = require("openai");

        const messages = [
            { role: 'system', content: 'You are an expert in constructing MongoDB queries for a collection of voter data, in which a document represents an individual voter. Here is an example document for you to use as a reference:\n{\"profile\":{\"suffix\":null,\"firstName\":\"John\",\"middleName\":null,\"lastName\":\"Smith\",\"dob\":\"2049-01-25T05:00:00.000Z\",\"gender\":\"M\",\"race\":3},\"address\":{\"addr1\":\"1002 Oxford Cir\",\"addr2\":null,\"city\":\"Gainesville\",\"state\":null,\"zip\":\"326075748\",\"mailAddr1\":\"7257 NW 4Th Blvd #273\",\"mailAddr2\":null,\"mailAddr3\":null,\"mailCity\":\"Gainesville\",\"mailState\":\"FL\",\"mailZip\":\"32607\",\"mailCountry\":null},\"contact\":{\"phoneArea\":null,\"phoneNumber\":null,\"phoneExtension\":null,\"email\":null},\"district\":{\"countyCode\":\"ALA\",\"congressionalDistrict\":\"3\",\"houseDistrict\":\"21\",\"senateDistrict\":\"9\",\"schoolBoardDistrict\":\"5\",\"precinct\":\"52\",\"precinctGroup\":\"0\",\"precinctSplit\":\"52.4\",\"precinctSuffix\":null},\"geoloc\":{\"matching\":\"Match\",\"exactness\":\"Non_Exact\",\"outputAddress\":\"1002 OXFORD CT, GAINESVILLE, FL, 32607\",\"tigerId\":\"6820086\",\"tigerIdSide\":\"R\",\"countyCode\":\"1\",\"tractCode\":\"2218\",\"blockCode\":\"1019\",\"streetInput\":\"1002 Oxford Cir\",\"cityInput\":\"Gainesville\",\"zipInput\":\"326075748\",\"type\":\"Point\",\"coordinates\":[-82.413749156,29.644428071]},\"_id\":\"65761c9d4a1d1e81cab4decf\",\"party\":\"DEM\",\"exempt\":\"N\",\"votes\":[{\"_id\":\"653dc9de7e849fdc88d6a59e\",\"countyCode\":\"ALA\",\"electionDate\":\"2020-11-03\",\"electionType\":\"GEN\",\"historyCode\":\"A\"},{\"_id\":\"653dca377e849fdc88da9b79\",\"countyCode\":\"ALA\",\"electionDate\":\"2008-11-04\",\"electionType\":\"GEN\",\"historyCode\":\"Y\"}],\"voterStatus\":\"ACT\",\"voter_id\":\"100450405”}\n\nEssentially, you need to carefully interpret a natural language question and, based on your analysis of my document schema, logically construct a MongoDB query pipeline that provides an answer to that question. \n\nIn doing so, you must adhere to the following rules:\n- Your responses must contain ONLY the query you generate, minified to one line, with no explanation. So just the query and nothing else. \n- Your responses must be informed by expert knowledge of constructing MongoDB queries.\n- The query you generate must be compatible with the Model.aggregate() Mongoose method, because every query you generate will be executed within the aggregate() method. \n- The query you generate must use MongoDB pipeline operators without causing any errors.\n- The query you generate must have correct JSON syntax, because I will be using JSON.parse() on the query you generate. Here is an example of a correctly formatted query: [{\"$match\":{\"profile.firstName\":\"Zachary\",\"profile.middleName\":\"Joel\",\"profile.lastName\":\"Carnell\"}},{\"$project\":{\"voter_id\":1,\"_id\":0}}] \n- You must put double quote marks around any MongoDB pipeline operators used within the query you generate.\n\nAlso, PLEASE make sure your query adheres to the following guideline:\n- The $size operator is used to match arrays in a document with a specific number of elements. It should always be used with an exact integer value, representing the size of the array. Comparison operations (like $gte, $lt) are not supported with $size. For example, to find documents where an array field votes has exactly 5 elements, use: { "votes": { "$size": 5 } }. Incorrect usage example (to avoid): { "votes": { "$size": { "$gte": 5 } } } - This format is not valid as $size does not support comparison operators. Now please await a natural language question.' }
        ];

        // If there is error feedback, add it to the messages array
        if (errorFeedback) {
            messages.push({
                role: 'system',
                content: errorFeedback
            });

            console.log(errorFeedback);
        }

        messages.push({ role: 'user', content: question });

        const functions = [
            {
                "name": "execute_mongo_query",
                "description": "Execute an aggregate mongo query pipeline and shows the result",
                "parameters": {
                      "type": "object",
                      "properties": {
                          "query": {
                              "type": "string",
                              "description": "Mongo aggregation pipeline query to execute",
                          },
                          "collection": {
                              "type": "string",
                              "description": "The collection to run the query",
                          },
                          "answer": {
                            "type": "string",
                            "description": "A natural language statement that incorparates the query result into a statement that leaves room for a fill-in-the-blank placeholder formatted as {data_result}. The placeholder MUST ALWAYS be written out as {data_result}, not {total}, {percentage}, or anything else.",
                          },
                          "explanation": {
                            "type": "string",
                            "description": "Briefly explain what the query does",
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
                      "required": ["query", "collection", "answer", "explanation", "titles"],
                },
            }
        ];

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        return openai.chat.completions.create({
            // model: "gpt-3.5-turbo",
            model: "gpt-3.5-turbo-instruct",
            temperature: 0.1,
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