// Developed with help from https://github.com/rpopuc/nl-mongodb-query-builder
class QueryBuilder {
    static async handle(question, errorMessage = null) {
        const { OpenAI } = require("openai");

        const messages = [
            { role: 'system', content: process.env.GPT_NLQ_INSTRUCTIONS },
            { role: 'user', content: question }
        ];

        // Add an error message if provided
        if (errorMessage) {
            messages.push({
                role: 'system',
                content: `Error encountered: ${errorMessage}. Please review the following guideline and reformulate the query: The $size operator is used to match arrays in a document with a specific number of elements. It should always be used with an exact integer value, representing the size of the array. Comparison operations (like $gte, $lt) are not supported with $size. For example, to find documents where an array field votes has exactly 5 elements, use: { "votes": { "$size": 5 } }. Incorrect usage example (to avoid): { "votes": { "$size": { "$gte": 5 } } } - This format is not valid as $size does not support comparison operators.`
            });
        }

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
                      "required": ["query", "collection", "answer", "titles"],
                },
            }
        ];

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        return openai.chat.completions.create({
            model: "gpt-3.5-turbo-0613",
            temperature: 0,
            max_tokens: 1000,
            messages,
            functions
        }).then(response => {
            const textResponse = response.choices[0].message.function_call.arguments;
            return textResponse;
        }).catch(error => {
            console.error("Error in QueryBuilder:", error);
            throw error; // Rethrow the error to be handled by the caller
        });
    }
}


module.exports = QueryBuilder;