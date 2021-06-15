const config1 = {
    parent: '#usersTable',
    columns: [
        {title: 'Имя', value: 'name'},
        {title: 'Фамилия', value: 'surname'},
        {title: 'Возраст', value: 'age'},
    ],
    apiUrl: "https://mock-api.shpp.me/ekanaev/users"
};

const users = [
    {id: 30050, name: 'Вася', surname: 'Петров', age: 12},
    {id: 30051, name: 'Вася', surname: 'Васечкин', age: 15},
    {id: 30052, name: 'Олег', surname: 'Шевчук', age: 44},
    {id: 30053, name: 'Евгений', surname: 'Лосев', age: 12},
    {id: 30054, name: 'Дмитрий', surname: 'Джанашвили', age: 18},
];

window.onload = () => DataTable(config1);

/*
 This function is draw a table. Data for the table is sets by the second function parameter. First parameter sets server
 path for download the data if there is no local data. Also first parameter sets the place in the html document where
 the table is adding.
 */
async function DataTable(config, data) {

    // if there is no data, takes data from a server
    let fromServer = false;
    if (data === undefined) {
        if (config.apiUrl === undefined) {
            throw new Error("There is no data to create a table.");
        }
        data = await getUserData(config.apiUrl).then((value) => {
            return value;
        })

        let parent = config.parent;
        let url = config.apiUrl;
        config = {
            parent: parent,
            columns: await getColumns(data).then(value => value),
            apiUrl: url,
        };
        fromServer = true;
    }

    const parentDiv = document.getElementById(config.parent.replace("#", ""));

    // adds a search and add block
    const tableNav = document.createElement("div");
    tableNav.classList.add("ownTable__tableNav");
    parentDiv.appendChild(tableNav)

    const searchField = document.createElement("input");
    searchField.setAttribute("type", "text");
    searchField.setAttribute("placeholder", "search");
    searchField.classList.add("ownTable__search");
    tableNav.appendChild(searchField);

    const addButton = document.createElement("button");
    addButton.setAttribute("type", 'button');
    addButton.innerHTML = 'Add';
    addButton.classList.add("ownTable__addButton");
    tableNav.appendChild(addButton);

    // builds the table
    const table = document.createElement("table");
    table.classList.add("ownTable__table");
    parentDiv.appendChild(table);
    const headerColumns = []
    createHeader(table, config, headerColumns);
    createBody(table, config, data, headerColumns, fromServer);

    // adds search function
    searchField.addEventListener("input", () => search(table, searchField.value))

    // adds add function
    addButton.addEventListener('click', () => addItem(table, data, config, headerColumns))
}


// Creates table header in html document
function createHeader(table, config, headerColumns) {
    const header = document.createElement("thead");
    header.classList.add("ownTable__thead");
    table.appendChild(header);
    const headerRow = document.createElement("tr");
    headerRow.classList.add("ownTable__tr")
    header.appendChild(headerRow);

    config.columns.map((item) => {
        headerColumns.push(item.value);
    })
    config.columns.map((item) => {
        let headerDataItem = document.createElement("th");
        headerDataItem.classList.add("ownTable__th")
        headerDataItem.innerHTML = item.title;
        headerRow.appendChild(headerDataItem);
    })

    // adds column with delete buttons
    let deleteColumn = document.createElement("th");
    deleteColumn.classList.add("ownTable__th");
    deleteColumn.innerHTML = "Delete";
    headerRow.appendChild(deleteColumn);
    headerColumns.push("delete")
}

// Creates table body in html document
function createBody(table, config, data, headerColumns, fromServer) {
    const body = document.createElement("tbody");
    body.classList.add("ownTable__tbody");
    table.appendChild(body);
    for (let i = 0; i < data.length; i++) {
        let row = document.createElement("tr");
        row.classList.add("ownTable__tr");
        row.setAttribute('data-id', data[i]['id'])
        body.appendChild(row);
        for (let column of headerColumns) {
            let cellData = document.createElement("td");
            cellData.classList.add("ownTable__td");
            if (data[i][column] !== undefined) {
                cellData.innerHTML = data[i][column];
            }
            row.appendChild(cellData);
            // adds delete button
            if (column === "delete") {
                addDeleteButton(config, data, row, cellData, fromServer);
            }
        }
    }
}

/*
    Performs a request to the server, and returns the data in the array format.
 */
async function getUserData(url) {
    let response = await fetch(url, {
        method: 'GET',
    });
    if (response.status !== 200) {
        return Promise.reject("Something went wrong");
    }
    let responseJSON = await response.json();
    let data = [];
    for (let dataItem in responseJSON.data) {
        data.push(responseJSON.data[dataItem]);
    }
    return Promise.resolve(data);
}

/*
    Defines columns from the date
 */
async function getColumns(tableData) {
    if (tableData.length === 0) {
        return Promise.reject("table is empty");
    }
    let item = tableData[0];
    let result = []
    for (let column in item) {
        if (column === "id") {
            continue;
        }
        result.push({
            title: column,
            value: column,
        })
    }
    return Promise.resolve(result);
}

/*
    Adds delete button to the cell in the "delete" column.
 */
function addDeleteButton(config, data, row, cell, fromServer) {
    let deleteButton = document.createElement("button");
    deleteButton.classList.add("ownTable__deleteButton");
    deleteButton.innerHTML = "Delete";
    cell.appendChild(deleteButton);
    if (fromServer) {
        deleteButton.addEventListener("click", () => {
            return deleteRow(data, row, config.apiUrl)
        })
    } else {
        deleteButton.addEventListener("click", () => {
            return deleteRow(data, row, null)
        })
    }
}

async function deleteRow(data, row, url) {
    let rowId = row.dataset.id;
    if (url === null) {
        for (let i = 0; i < data.length; i++) {
            if (data[i]["id"] === rowId) {
                data.splice(i, 1);
            }
        }
        row.parentElement.removeChild(row);
        return;
    }
    let response = await fetch((url + "/" + rowId), {
        method: "DELETE"
    })
    if (response.status !== 200) {
        throw new Error("cannot delete value")
    }
    row.parentElement.removeChild(row);

}

/*
    This function hides rows this invalid information.
 */
function search(table, request) {
    request = request.toLowerCase().split(" ");
    let rows = table.querySelector('.ownTable__tbody').childNodes;
    rows.forEach((row) => {
        let rowData = ""
        let isValid = true;
        row.childNodes.forEach((cell) => {
            rowData += cell.innerHTML.toLowerCase() + " ";
        })
        for (let word of request) {
            if (!rowData.includes(word)) isValid = false;
        }
        isValid ? row.style.display = "table-row" : row.style.display = "none"
    })
}

/*
    Creates form at the top of the table, that includes input fields for adds new value to the table.
    For adds new row you have to press enter.
 */
function addItem(table, data, config, headerColumns) {
    let tbody = table.querySelector('.ownTable__tbody');

    let inputRow = document.createElement('tr');
    inputRow.classList.add('.ownTable__tr');

    // adds inputRow to the top
    let firstChild = tbody.firstChild;
    tbody.insertBefore(inputRow, firstChild);

    let allFields = {};

    for (let column of headerColumns) {
        if (column === 'delete') continue;

        let cell = document.createElement('td');
        let field = document.createElement('input');
        field.setAttribute('type','text');
        field.classList.add('ownTable__addInput');
        field.addEventListener('keydown', function(e) {
            if (e.keyCode === 13) checkSendForm(table, data, config, inputRow, allFields, headerColumns);
        });
        allFields[column] = field;
        cell.appendChild(field);
        inputRow.appendChild(cell);
    }
}

/*
    Checks data in all field and if the data is correct, it performs a request to the server for add this form.
 */
async function checkSendForm(table, data, config, inputRow, fields, headerColumns) {
    let isCorrect = true;
    for (let fieldName in fields) {
        let field = fields[fieldName];
        if (field.value.replaceAll(' ', '') === "") {
            isCorrect = false;
            field.classList.toggle('ownTable__addInputEmpty');
        } else {
            if (field.classList.contains('ownTable__addInputEmpty')) {
                field.classList.remove('ownTable__addInputEmpty');
            }
        }
    }
    if (!isCorrect) {
        return;
    }

    let cells = {};
    for (let field in fields) {
        cells[field] = fields[field].value;
    }

    // create id of the new row
    let rows = table.querySelector('.ownTable__tbody').querySelectorAll('.ownTable__tr');
    let id = 0;
    rows.forEach((row) => {
        if (row.dataset.id !== "undefined" && parseInt(row.dataset.id) > id) {
            id = parseInt(row.dataset.id);
        }
    })
    cells['id'] = ++id;

    await sendNewRow(cells, config.apiUrl);

    drawNewRow(table, data, config, inputRow, headerColumns, cells);
}



async function sendNewRow(cells, apiUrl) {
    let response = await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(cells),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    if (response.status !== 200) {
        throw new Error("cannot add new value");
    }
}

/*
    adds new row to html document ant to local data in this document.
 */
function drawNewRow(table, data, config, inputRow, headerColumns, cells) {
    let tbody = table.querySelector('.ownTable__tbody');
    let newRow = document.createElement('tr');
    newRow.classList.add('ownTable__tr');
    newRow.setAttribute('data-id', cells.id);
    for (let column of headerColumns) {
        let cell = document.createElement('td');
        newRow.appendChild(cell);
        cell.classList.add('ownTable__td');
        if (column === "delete") {
            addDeleteButton(config, data, newRow, cell, true)
            continue;
        }
        cell.innerHTML = cells[column];
    }
    tbody.appendChild(newRow);
    inputRow.parentElement.removeChild(inputRow);
    data.push(cells);

}