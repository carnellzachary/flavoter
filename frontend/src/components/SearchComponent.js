import React, { useState } from 'react';
import '../css/SearchComponent.css';

const AccordionItem = ({ title, content }) => {
	const [isOpen, setIsOpen] = useState(false);

	// Toggle function to handle accordion opening/closing
	const toggle = () => {
		setIsOpen(!isOpen);
	};

	// Caret icon style that changes based on the state
	const caretStyle = {
		transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
		transition: 'transform 0.3s ease',
	};

	// Apply conditional class based on isOpen state
	const contentClassName = `accordion-content ${isOpen ? 'open' : 'closed'}`;

	return (
		<div className="accordion-item">
			<button className="accordion-title" onClick={toggle}>
				{title}
				<span style={caretStyle}>&#9650;</span>{' '}
				{/* Adjust caret direction if needed */}
			</button>
			<div className={contentClassName}>{content}</div>
		</div>
	);
};

const SearchComponent = () => {
	const accordionItems = [
		{
			title: 'Profile',
			content: (
				<form>
					<div className="input-group">
						<label>Full Name</label>
						<input type="text" name="fullName" />
					</div>
					<div className="input-group">
						<label>Birth Date</label>
						<input type="date" name="birthDate" />
					</div>
					<div className="input-group">
						<label>Gender</label>
						<select name="gender">
							<option value="F">Female</option>
							<option value="M">Male</option>
							<option value="U">Unknown</option>
						</select>
					</div>
					<div className="input-group">
						<label>Race</label>
						<select name="race">
							{/* Populate options based on your schema */}
						</select>
					</div>
					{/* Add more fields as needed */}
				</form>
			),
		},
		{
			title: 'District',
			content: (
				<form>
					<div className="input-group">
						<label>County Code</label>
						<input type="text" name="countyCode" />
					</div>
					{/* Add more fields as per your schema */}
				</form>
			),
		},
		{
			title: 'Address',
			content: (
				<form>
					<div className="input-group">
						<label>Residence Street</label>
						<input type="text" name="residenceStreet" />
					</div>
					{/* Continue adding fields for address */}
				</form>
			),
		},
		// Extend this pattern for additional categories
	];

	return (
		<div className="column">
			<h2>Search</h2>
			{/* Existing content */}
			{accordionItems.map((item, index) => (
				<AccordionItem key={index} title={item.title} content={item.content} />
			))}
		</div>
	);
};

export default SearchComponent;
