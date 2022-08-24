const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");

// Locally load environment vairables
require('dotenv').config()


API_KEY = process.env.SALESLOFT_API_KEY;

const config = {
  headers: { Authorization: `Bearer ${API_KEY}` },
};

async function main() {
  const results = [];
  const stream = fs.createReadStream("people.csv")
    //   .pipe(stripBomStream())
    .pipe(csv())
    .on("data", async (row) => {
      try {
        stream.pause();
        console.log("Salesloft ID:", row["salesloft_id"]);
        let salesloft_id = row["salesloft_id"];
        await updatePerson("https://api.salesloft.com/v2/people/", salesloft_id, {
          person_stage_id: 17118
        });
        await getPersonCadences("https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=", salesloft_id);
      } finally {
        stream.resume();
      }
    })
    .on("data", (data) => results.push(data))
    .on("end", () => {
      // console.log(results);
      // console.log(results[0].salesloft_id);
    });
}

main();

async function updateDetailsDocument(updateDetails) {
  let details = {};
  for (let detail in details) {
    details[detail] = updateDetails[detail];
  }
  console.log(details);
  return details;
}

async function getPerson(uri, id) {
  const request = await axios
    .get(uri + id, config)
    .then((res) => {
      console.log(`Get person status: ${res.status}`);
      // console.log(res.data);
    })
    .catch((error) => {
      console.error(error);
    });
}

async function updatePerson(uri, id, details) {
  const request = await axios
    .put(uri + id, details, config)
    .then((res) => {
      console.log(`Update status: ${res.status}`);
      let data = res.data;
      let stage = data.data.person_stage.id;
      if (stage == 17118) {
        console.log("Stage: Open")
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

async function getPersonCadences(uri, id) {
  const request = await axios
    .get(uri + id, config)
    .then( async (res) => {
      // console.log(`statusCode: ${res.status}`);
      // console.log(res.data);
      let cadenceEnrollments = res.data;
      if (cadenceEnrollments['data'].length > 0) {
        for(const enrollment of cadenceEnrollments['data']) {
          let cadenceId = enrollment['id'];
          let cadenceState = enrollment['currently_on_cadence'];
          let cadenceEntryDate = new Date(enrollment['created_at']);
          let today = new Date();
          let daysApart = dateDiffInDays(cadenceEntryDate, today);
          // Check if cadence is active
          if (cadenceState == true) {
            console.log("Active in cadence, enrollment id:", cadenceId);
            // Check if cadence enrollment date is older than 90 days
            if (daysApart > 90) {
              console.log("Cadence enrollment deleted, cadence enrollment was:", daysApart, "days ago");
              const result = await deletePersonCadence(cadenceId);
              console.log(result);
              // Check if cadence enrollment date is less than 90 days
            } else if (daysApart < 90) {
              console.log("Cadence enrollment not deleted, cadence enrollment was:", daysApart, "days ago");   
            }
          } else {

          }
        }
      } else {
        console.log("Not enrolled in any cadences");
      }
    })
    .catch((error) => {
      console.error(error);
    })
}

async function deletePersonCadence(id) {
  const request = await axios
    .delete(`https://api.salesloft.com/v2/cadence_memberships/${id}.json`, config)
    .then((res) => {
      console.log(`StatusCode: ${res.status}`);
      // console.log(res.data)
    })
    .catch((error) =>{
      console.error(error);
    })
}

const _MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};