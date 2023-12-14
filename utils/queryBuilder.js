class QueryBuilder {

    static async handle(question) {
        const { OpenAI } = require("openai");

        const messages = [
            { role: 'system', content: process.env.GPT_NLQ_INSTRUCTIONS },
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