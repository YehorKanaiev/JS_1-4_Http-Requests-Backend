
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
];

window.onload = () => DataTable(config1);

async function DataTable(config, data) {

    // if there is no data, takes data from a server
    let fromServer = false;
    if (data === undefined) {
        if (config.apiUrl === undefined) {
            throw new Error("There is no data to create a table.");
        }
        data = await getUserData(config.apiUrl).then((value) => {return value;})
        let parent = config.parent;
        let url = config.apiUrl;
        config = {
            parent: parent,
            columns: await getColumns(data).then(value => value),
            apiUrl: url,
        };
        fromServer = true;
    }

    const parentDiv = document.getElementById(config.parent.replace("#",""));

    // adds a search and add block
    const tableNav = document.createElement("div");
    tableNav.classList.add("ownTable__tableNav");
    parentDiv.appendChild(tableNav)

    const inputField = document.createElement("input");
    inputField.setAttribute("type", "text");
    inputField.classList.add("ownTable__search");
    tableNav.appendChild(inputField);

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


    createHeader(table);

    createBody(table);

    // creates header of the table
    function createHeader(table) {
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

    // creates body of the table
    function createBody(table) {
        const body = document.createElement("tbody");
        body.classList.add("ownTable__tbody");
        table.appendChild(body);
        for (let i = 0; i < data.length; i++) {
            let row = document.createElement("tr");
            row.classList.add("ownTable__tr");
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
                    let deleteButton = document.createElement("button");
                    deleteButton.classList.add("ownTable__deleteButton");
                    deleteButton.innerHTML = "Delete";
                    cellData.appendChild(deleteButton);
                    if (fromServer) {
                        deleteButton.addEventListener("click", () => {return deleteRow(table, config, data, config.apiUrl, data[i]["id"])})
                    } else {
                        deleteButton.addEventListener("click", () => {return deleteRow(table, config, data,null, data[i]["id"])})
                    }
                }
            }
        }
    }
}


async function getUserData (url) {
    let response = await fetch(url, {
        method: 'GET',
    });
    if (response.status !== 200) {
        return  Promise.reject("Something went wrong");
    }
    let responseJSON = await response.json();
    let users = [];
    for (let user in responseJSON.data) {
        users.push(responseJSON.data[user]);
    }
    return Promise.resolve(users);
}


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

async function deleteRow(table, config, data, url, id) {
    if (url === null) {
        console.log("here")
        for (let i = 0; i < data.length; i++) {
            if (data[i]["id"] === id) {
                data.splice(i,1);
            }
        }
        // deletes old table and create a new table
        table.parentElement.removeChild(table);
        await DataTable(config, data);
        return;
    }
    let response = await fetch((url + "/" + id), {
        method: "DELETE"
    })
    if (response.status !== 200) {
        throw new Error("cannot delete value")
    }
    // deletes old table and create a new table
    table.parentElement.removeChild(table);
    await DataTable(config)
}

// ============================== Search ========================================
/*
window.onload = () => {
    searchField.addEventListener("input", () => {

    })
}
*/

