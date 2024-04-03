import React, { useState } from 'react';
import Typewriter from 'typewriter-effect';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import '../css/AskComponent.css';

const AskComponent = () => {
	const [question, setQuestion] = useState('');
	const [answer, setAnswer] = useState('');
	const [query, setQuery] = useState('');
	const [showQuery, setShowQuery] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleQuestionSubmit = async () => {
		setLoading(true); // Start the loading spinner

		try {
			const encodedQuestion = encodeURIComponent(question);
			const response = await fetch(
				`http://localhost:5000/api/v1/voters/askgpt?question=${encodedQuestion}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();
			setAnswer(data.answer);
			setQuery(JSON.stringify(data.query, null, 2));
		} catch (error) {
			console.error('Error fetching data: ', error);
			setAnswer('An error occurred while fetching data.');
		} finally {
			setLoading(false); // Stop the loading spinner
		}
	};

	return (
		<div className="column ask-column">
			<h2>Ask</h2>
			<p>
				<i>Use natural language questions to query Florida voter data</i>
			</p>
			<div className="input-container">
				<input
					type="text"
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					placeholder="Ask a data question about Florida voters..."
				/>
				{/* Conditionally render submit or loading icon */}
				{loading ? (
					<button className="submit-button loading">
						<div className="loader quantum-spinner"></div>
					</button>
				) : (
					<button
						className="submit-button"
						onClick={handleQuestionSubmit}
						disabled={loading}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 320 512"
							fill="#FFFFFF"
						>
							<path d="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64v3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74V320c0 17.7 14.3 32 32 32s32-14.3 32-32v-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7V160c0-70.7-57.3-128-128-128H144C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
						</svg>
					</button>
				)}
			</div>

			<div className="response-area">
				{!loading && answer && (
					<Typewriter
						options={{
							delay: 20,
						}}
						onInit={(typewriter) => {
							typewriter.typeString(answer).start();
						}}
					/>
				)}
				{showQuery && query && (
					<SyntaxHighlighter language="json" style={docco}>
						{query}
					</SyntaxHighlighter>
				)}
				{query && !loading && (
					<button onClick={() => setShowQuery(!showQuery)}>
						{showQuery ? 'Hide' : 'Show'} Query
					</button>
				)}
			</div>
		</div>
	);
};

export default AskComponent;
