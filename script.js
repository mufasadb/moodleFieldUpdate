const moodle_client = require("moodle-client");
const csv = require('csv-parser');
const fs = require('fs');
const moodleURL = ""
const moodleToken = ""

// csv is expected in same folder as script, must include suffix, must be csv file type, must be comma as seperator.
const csvName = 'gc.csv';




//set to true if email domain should be forced to something specific
//must include @ symbol i.e. "@navitas.com"
const overWriteWithSuffix = true
const overWriteSuffix = "@navitas.com"


// Because I'm lazy and async hell is annoying, these function chain into one another if succesfful, 
// readCSV -> doMoodle -> getIDs -> for each address: updateAddress
// should log any errors caught from reading the CSV or from either of the moodle calls.
//uncomment runScript to run the script



// runScript()

const userList = []
let emailList = []

function runScript() {
    readCSV()
}


for (let user in userList) {
    emailList.push(user.R1Email)
}
console.log(emailList)

function doMoodle(emailList, userList) {
    moodle_client.init({
        wwwroot: moodleURL,
        token: moodleToken

    }).then(function (client) {

        // return updateZoom(client, userID, zoomAddress);
        getID(client)

    }).catch(function (err) {
        console.log("Unable to initialize the client: " + err);
    });
}

function matchAndUpdate(users, client) {
    console.log(`matching ${users.length} users`)
    for (user of users) {
        let updateEmail = user.email
        if (overWriteWithSuffix) {
            updateEmail = user.email.slice(0, user.email.indexOf('@')) + overWriteSuffix;
        }
        console.log(`Now updating the user with email address ${user.email} with the Zoom user of ${updateEmail}`)
        updateZoom(client, user.id, updateEmail)
    }
}

function getID(client) {
    return client.call({
        wsfunction: "core_user_get_users_by_field",
        args: {
            field: "email",
            values: emailList
        }

    }).then(function (results) {
        let users = []
        for (user of results) {
            users.push({ id: user.id, email: user.email })
        }
        matchAndUpdate(users, client)
    }).catch(function (error) {
        console.log(error)
    })
}
function updateZoom(client, userID, zoomAddress) {
    return client.call({
        wsfunction: "core_user_update_users",
        args: {
            users: [
                {
                    id: userID,
                    customfields: [
                        {
                            type: "ncmzoomid",
                            value: zoomAddress
                        }
                    ]
                }
            ]
        }

    }).then(function (info) {
        console.log('updated')
        return;
    }).catch(function (error) {
        console.log(error)
    });
}


function readCSV() {
    fs.createReadStream(csvName)
        .pipe(csv())
        .on('data', (row) => {


            userList.push(row)
            // console.log(row);
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
            console.log(`${userList.length} users in the list`)
            for (user of userList) {
                emailList.push(user.R1Email)
            }
            doMoodle(emailList, userList)
        });
}

