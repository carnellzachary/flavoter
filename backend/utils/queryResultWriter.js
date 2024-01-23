class QueryResultWriter {

    static async handle(question, query, queryResult) {
        const fs = require('fs');
        const { OpenAI } = require("openai");

        const system_instructions = fs.readFileSync(__dirname + '/../templates/resultWriterRules.template', 'utf-8');        
        const messages = [
            { role: 'system', content: system_instructions },
            { role: 'user', content: `Here's the question that a query was generated from: ${question} \n\n\Here's the query that was generated: ${query} \n\nAnd here's the query result: ${queryResult} \n\nPlease write an answer statement that effectively incorparates the query result(s).` }
        ];

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        return openai.chat.completions.create({
            // model: "gpt-3.5-turbo",
            model: "gpt-3.5-turbo-1106",
            temperature: 0.5,
            max_tokens: 1000,
            messages,
        }).then(response => {
            // const textResponse = response.choices[0].message.function_call.arguments;
            const textResponse = response.choices[0].message.content;

            return textResponse
        }).catch(error => console.log(error));
    }
}

module.exports = QueryResultWriter;

