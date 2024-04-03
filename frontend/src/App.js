import React from 'react';
import './css/App.css';
import SearchComponent from './components/SearchComponent';
import LocateComponent from './components/LocateComponent';
import AskComponent from './components/AskComponent';

const App = () => {
	return (
		<div className="main-layout">
			<AskComponent />
		</div>
	);
};

export default App;
