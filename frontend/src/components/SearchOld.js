import React, { useState } from 'react';

function VoterSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      // Don't perform an empty search
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/v1/voters?voterName=${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.data); // Assuming your API returns data in a specific format
        console.log('Response:', data); // Log the response data
      } else {
        console.error('Error fetching search results:', response.status);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Voter Search</h1>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter voter's full name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="input-group-append">
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>
      <ul className="list-group">
        {results.map((voter) => (
          <li key={voter._id} className="list-group-item">
            {voter.profile.fullName}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VoterSearch;
