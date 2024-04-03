import React, { useState } from 'react';

function AskGPT() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');

  const handleAsk = async () => {
    if (question.trim() === '') {
      // Don't perform an empty search
      return;
    }

    try {
      // Construct the URL with the question as a query parameter
      const url = `http://localhost:5000/api/v1/voters/askgpt?question=${encodeURIComponent(question)}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setResponse(data.response); // Assuming your API returns the response in a specific format
        console.log('Response:', data); // Log the response data
      } else {
        console.error('Error fetching response:', response.status);
      }
    } catch (error) {
      console.error('Error fetching response:', error);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Ask GPT</h1>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Ask a question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="input-group-append">
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleAsk}
          >
            Ask
          </button>
        </div>
      </div>
      {response && (
        <div className="alert alert-success" role="alert">
          {response}
        </div>
      )}
    </div>
  );
}

export default AskGPT;
