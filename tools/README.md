# Import lattice data in Excel to MongoDB
Use xlsx library to read data.

Data files are uploaded on trello.com runcheck sprint2 board. There are some format changes between the Original file and the modified file. Each sheet saves one branch,
The following is the branch data format of one sheet in modified file:

| systm         |subsytem          | devie         |
| ------------- | ---------------- | ------------- |
| foo           | 123              | abc           |
| bar           | 345              | def           |

The following are the main steps for importing slot data:
  - delete column named 'Distance from Artemis source (m)' in slots data.
  - if type of field is number, delete the unit in field.
  - if column 'systm' or 'subsytem' or 'devie' or 'Beam line position (dm)' are empty, delete the row.