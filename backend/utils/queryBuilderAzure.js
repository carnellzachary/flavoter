class QueryBuilder {

    static async handle(question, errorFeedback) {
        const fs = require('fs');
        const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

        const dateToday = new Date().toISOString();

        const system_instructions = fs.readFileSync(__dirname + '/../templates/queryBuilderRules.template', 'utf-8').replace("<THE DATE TODAY>", dateToday);        
        const messages = [
            { role: "system", content: system_instructions },
            {
                "role": "user",
                "content": "How many voters live in Miami?"
            },
            {
                "role": "assistant",
                "content": "[{\"$match\":{\"address.residenceCity\":\"Miami\"}},{\"$count\":\"numberOfVoters\"}]"
            },
            {
                "role": "user",
                "content": "Good job! That's a well-constructed query pipeline that provides an accurate answer to my natural language request.      \n    \nNow I have a different natural language request: What percentage of voters live in Miami?"
            },
            {
                "role": "assistant",
                "content": "[{\"$group\":{\"_id\":null,\"total\":{\"$sum\":1},\"miamiResidents\":{\"$sum\":{\"$cond\":[{\"$eq\":[\"$address.residenceCity\",\"Miami\"]},1,0]}}}},{\"$project\":{\"_id\":0,\"percentage\":{\"$multiply\":[{\"$divide\":[\"$miamiResidents\",\"$total\"]},100]}}}]"
            },
            {
                "role": "user",
                "content": "Good job! That's a well-constructed query pipeline that provides an accurate answer to my natural language request.        \n      \nNow I have a different request: What are the top 5 counties with the highest percentage of voters who have no party affiliation?"
            },
            {
                "role": "assistant",
                "content": "[{\"$match\":{\"politicalParty\":\"NPA\"}},{\"$group\":{\"_id\":\"$district.countyCode\",\"noPartyAffiliationCount\":{\"$sum\":1}}},{\"$sort\":{\"noPartyAffiliationCount\":-1}},{\"$limit\":5},{\"$lookup\":{\"from\":\"voters\",\"localField\":\"_id\",\"foreignField\":\"district.countyCode\",\"as\":\"countyVoters\"}},{\"$unwind\":\"$countyVoters\"},{\"$group\":{\"_id\":\"$_id\",\"noPartyAffiliationCount\":{\"$first\":\"$noPartyAffiliationCount\"},\"totalVoters\":{\"$sum\":1}}},{\"$project\":{\"_id\":0,\"countyCode\":\"$_id\",\"percentageNPA\":{\"$multiply\":[{\"$divide\":[\"$noPartyAffiliationCount\",\"$totalVoters\"]},100]}}},{\"$sort\":{\"percentageNPA\":-1}}]"
            },
            {
                "role": "user",
                "content": "Uh oh. This query is so slow that I don't even have time to wait for the results to then verify the results. Instead, use the following query as a reference to make a more efficient query: [{\"$group\":{\"_id\":{\"countyCode\":\"$district.countyCode\",\"politicalParty\":\"$politicalParty\"},\"count\":{\"$sum\":1}}},{\"$group\":{\"_id\":\"$_id.countyCode\",\"totalVoters\":{\"$sum\":\"$count\"},\"npaVoters\":{\"$sum\":{\"$cond\":[{\"$eq\":[\"$_id.politicalParty\",\"NPA\"]},\"$count\",0]}}}},{\"$project\":{\"_id\":1,\"npaPercentage\":{\"$multiply\":[{\"$divide\":[\"$npaVoters\",\"$totalVoters\"]},100]}}},{\"$sort\":{\"npaPercentage\":-1}},{\"$limit\":5}]\n\nRemember this. Going forward, when constructing queries for similar requests, be mindful of this more efficient query. You should always make every query as efficient as possible, without sacrificing logic or accuracy."
            },
            {
                "role": "assistant",
                "content": "[{\"$group\":{\"_id\":{\"countyCode\":\"$district.countyCode\",\"politicalParty\":\"$politicalParty\"},\"count\":{\"$sum\":1}}},{\"$group\":{\"_id\":\"$_id.countyCode\",\"totalVoters\":{\"$sum\":\"$count\"},\"npaVoters\":{\"$sum\":{\"$cond\":[{\"$eq\":[\"$_id.politicalParty\",\"NPA\"]},\"$count\",0]}}}},{\"$project\":{\"_id\":0,\"countyCode\":\"$_id\",\"npaPercentage\":{\"$multiply\":[{\"$divide\":[\"$npaVoters\",\"$totalVoters\"]},100]}}},{\"$sort\":{\"npaPercentage\":-1}},{\"$limit\":5}]"
            },
            {
                "role": "user",
                "content": "Good job! You effectively modified the slow query to make it more efficient while still providing an accurate answer to my natural language request. Be sure to learn from this modified approach so that, going forward, you can construct more efficient queries for similar requests.         \n        \nNow I have a different request: What is the average age of a Republican voter who lives in Tampa?"
            },
            {
                "role": "assistant",
                "content": "[{\"$match\":{\"address.residenceCity\":\"Tampa\",\"politicalParty\":\"REP\"}},{\"$project\":{\"age\":{\"$divide\":[{\"$subtract\":[{\"$toDate\":\"$$NOW\"},{\"$toDate\":\"$profile.birthDate\"}]},31557600000]}}},{\"$group\":{\"_id\":null,\"averageAge\":{\"$avg\":\"$age\"}}},{\"$project\":{\"_id\":0,\"averageAge\":1}}]"
            },
            {
                "role": "user",
                "content": "Good job! That's a well-constructed query pipeline that provides an accurate answer to my request.        \n      \nNow I have a different request: Which racial demographic had the largest decline in voter turnout from 2016 to 2020?"
            },
            {
                "role": "assistant",
                "content": "[{\"$match\":{\"pastVotes.electionDate\":{\"$gte\":ISODate(\"2016-01-01T00:00:00.000Z\"),\"$lte\":ISODate(\"2020-12-31T23:59:59.999Z\")},\"pastVotes.electionType\":\"GEN\"}},{\"$unwind\":\"$pastVotes\"},{\"$match\":{\"pastVotes.electionDate\":{\"$gte\":ISODate(\"2016-01-01T00:00:00.000Z\"),\"$lte\":ISODate(\"2020-12-31T23:59:59.999Z\")},\"pastVotes.electionType\":\"GEN\"}},{\"$group\":{\"_id\":{\"race\":\"$profile.race\",\"year\":{\"$year\":\"$pastVotes.electionDate\"}},\"voterCount\":{\"$sum\":1}}},{\"$sort\":{\"_id.year\":1}},{\"$group\":{\"_id\":\"$_id.race\",\"voterCounts\":{\"$push\":{\"year\":\"$_id.year\",\"count\":\"$voterCount\"}}}},{\"$project\":{\"race\":\"$_id\",\"_id\":0,\"voterCounts\":1,\"decline\":{\"$let\":{\"vars\":{\"firstYearCount\":{\"$arrayElemAt\":[\"$voterCounts.count\",0]},\"lastYearCount\":{\"$arrayElemAt\":[\"$voterCounts.count\",1]}},\"in\":{\"$subtract\":[\"$$firstYearCount\",\"$$lastYearCount\"]}}}}},{\"$sort\":{\"decline\":-1}},{\"$limit\":1}]"
            },
            {
                "role": "user",
                "content": "Sorry, I need to amend my request: Which racial demographic had the largest PERCENTAGE decline in voter turnout between the 2016 general election and the 2020 general election?"
            },
            {
                "role": "assistant",
                "content": "[{\"$match\":{\"pastVotes\":{\"$elemMatch\":{\"electionType\":\"GEN\",\"electionDate\":{\"$in\":[ISODate(\"2016-11-08T00:00:00Z\"),ISODate(\"2020-11-03T00:00:00Z\")]}}}}},{\"$unwind\":\"$pastVotes\"},{\"$match\":{\"pastVotes.electionType\":\"GEN\",\"pastVotes.electionDate\":{\"$in\":[ISODate(\"2016-11-08T00:00:00Z\"),ISODate(\"2020-11-03T00:00:00Z\")]}}},{\"$group\":{\"_id\":{\"race\":\"$profile.race\",\"year\":{\"$year\":\"$pastVotes.electionDate\"}},\"voterCount\":{\"$sum\":1}}},{\"$sort\":{\"_id.year\":1}},{\"$group\":{\"_id\":\"$_id.race\",\"counts\":{\"$push\":{\"year\":\"$_id.year\",\"count\":\"$voterCount\"}}}},{\"$project\":{\"race\":\"$_id\",\"_id\":0,\"counts\":1,\"percentageDecline\":{\"$cond\":[{\"$eq\":[{\"$arrayElemAt\":[\"$counts.year\",0]},2016]},{\"$multiply\":[{\"$divide\":[{\"$subtract\":[{\"$arrayElemAt\":[\"$counts.count\",0]},{\"$arrayElemAt\":[\"$counts.count\",1]}]},{\"$arrayElemAt\":[\"$counts.count\",0]}]},100]},0]}}},{\"$sort\":{\"percentageDecline\":-1}},{\"$limit\":1}]"
            },
            {
                "role": "user",
                "content": "The provided query is logically sound and addresses the requirement of finding the racial demographic with the largest percentage decline in voter turnout between 2016 and 2020 General Elections. However, there are aspects that could be improved for efficiency and clarity:\n\n- Redundant $match Stages: The query uses the $match stage both before and after the $unwind stage with similar conditions. The first $match is more efficient since it reduces the number of documents going into $unwind, but the second $match is essentially filtering the same set of conditions again. This could be streamlined.\n\n- Use of $sort and $group: The query sorts the documents by year and then regroups them by race. This can be optimized. It's more efficient to group once by both race and year and then reshape the data in the subsequent stages.\n\n- Array Index Assumptions: The query assumes that the first element in the counts array corresponds to the year 2016 and the second to 2020. While this might be true in most cases, it's safer to explicitly match these years to avoid potential errors with data ordering.\n\n- Efficiency in $project Stage: The $project stage can be optimized for clarity and to ensure accurate calculations regardless of the order of years in the array.\n\nHere's how I would rewrite the query for improved efficiency and clarity: [{\"$unwind\":\"$pastVotes\"},{\"$match\":{\"pastVotes.electionType\":\"GEN\",\"pastVotes.electionDate\":{\"$in\":[ISODate(\"2016-11-08T00:00:00Z\"),ISODate(\"2020-11-03T00:00:00Z\")]}}},{\"$group\":{\"_id\":{\"race\":\"$profile.race\",\"year\":{\"$year\":\"$pastVotes.electionDate\"}},\"voterCount\":{\"$sum\":1}}},{\"$group\":{\"_id\":\"$_id.race\",\"yearCounts\":{\"$push\":{\"year\":\"$_id.year\",\"count\":\"$voterCount\"}}}},{\"$project\":{\"race\":\"$_id\",\"_id\":0,\"counts\":{\"$arrayToObject\":{\"$map\":{\"input\":\"$yearCounts\",\"as\":\"yc\",\"in\":{\"k\":{\"$toString\":\"$$yc.year\"},\"v\":\"$$yc.count\"}}}}}}},{\"$addFields\":{\"declinePercentage\":{\"$let\":{\"vars\":{\"count2016\":{\"$ifNull\":[\"$counts.2016\",0]},\"count2020\":{\"$ifNull\":[\"$counts.2020\",0]}},\"in\":{\"$cond\":[{\"$eq\":[\"$$count2016\",0]},0,{\"$multiply\":[{\"$divide\":[{\"$subtract\":[\"$$count2016\",\"$$count2020\"]},\"$$count2016\"]},100]}]}}}}},{\"$sort\":{\"declinePercentage\":-1}},{\"$limit\":1}]\n\nThis modified approach aims to be more robust against data order and potential edge cases, such as missing data for a year. Please learn from this. Be mindful of this modified approach when encountering similar requests going forward.\n\nNow for a different request: How many calories are in an apple?"
            },
            {
                "role": "assistant",
                "content": "I'm sorry. I can only generate responses for Florida voter data. Please refocus and rephrase your request."
            },
            {
                "role": "user",
                "content": "Good job! You responded to an irrelevant request with the correct response. Thank you.\n\nNow I have a different request: Blah blah asijdoias jdoj saodj oasdjoi?"
            },
            {
                "role": "assistant",
                "content": "I'm sorry. I could not understand your request. Please rephrase it and try again."
            },
            {
                "role": "user",
                "content": "Good job! You responded to an incomprehensible request with the correct response. Thank you.  \n\nNow I have a different request: How many voters who live in Gainesville are younger than 24 years old, as of 01/19/2024?"
            },
            {
                "role": "assistant",
                "content": "[{\"$match\":{\"$and\":[{\"address.residenceCity\":\"Gainesville\"},{\"profile.birthDate\":{\"$gt\":ISODate(\"2000-01-19T00:00:00.000Z\")}}]}},{\"$count\":\"numberOfVoters\"}]"
            },
            {
                "role": "user",
                "content": "Good job! That is a well-constructed query that correctly avoids using 'new Date()'  \n\nAlways remember to never use 'new Date()'  \n\nAt the moment, I don't have another request. Please remain idle until I send a message with a request."
            },
            {
                "role": "assistant",
                "content": "Understood. I'll be here when you're ready with your next request."
            }
        ];

        // If there is error feedback, add it to the messages array
        if (errorFeedback) {
            messages.push({
                role: 'user',
                content: errorFeedback
            });

           // console.log(errorFeedback);
        } else {
            messages.push({ role: 'user', content: "Now I have a different request: " + question });
        }

        // Function: Natural language response that incorpartes data result into a sentence
       /* const dataResultSentence = {
            name: "data_result_sentence",
            description: "Write a natural language statement that incorparates the query result into a complete sentence that answers the user request.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The MongoDB aggregation query generated in response to the user request",
                },
                titles: {
                    type: "object",
                    description: "A map of field names to titles to present the results",
                    properties: {
                        field: {
                            type: "string",
                        },
                        title: {
                            type: "string",
                        },
                        type: {
                            type: "string",
                        }
                    },
                },
                answer: {
                    type: "string",
                    description: "A natural language statement that answers the user request with a complete sentence that includes placeholders for the query results. Sometimes, there may be one results. Other times, there may be multiple results. The answer must account for this",
                },
              },
              required: ["query", "answer", "titles"],
            },
          };
          */

        const options = {
            temperature: 0.1,
        };

        const client = new OpenAIClient(
            "https://openai-flavoter-west.openai.azure.com/", 
            new AzureKeyCredential("7b2e4a234bcf45de9618929da9c86288")
          );
      
          try {
              const response = await client.getChatCompletions("gpt-4-1106", messages, options);

              const { choices } = response;
              for (const choice of choices) {
                  return choice.message;
              }
          } catch (error) {
              console.error("Error:", error);
          }
    }
}

module.exports = QueryBuilder;



