// IF ADDED TO CADENCE LESS THAN 14 DAYS AGO DO NOT REMOVE DO NOT SET TO OPEN
// IF NOT CONTACTED > 30 DAYS AGO AND NOT ADDED TO CADENCE > 14 DAYS AGO SET TO OPEN AND REMOVE FROM CADENCES

const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");
const { response } = require("express");
const queryString = require('query-string');

// Locally load environment vairables
require('dotenv').config()

API_KEY = process.env.SALESLOFT_API_KEY;

axios.defaults.headers.common['Authorization'] = `Bearer ${API_KEY}`;
// Add a request interceptor
axios.interceptors.request.use(function (config) {
  // Serialize the parameteters
  config.paramsSerializer = params => queryString.stringify(params, { arrayFormat: 'brackets' })
  return config
});
// axios.interceptors.request.use(function (config) {
//   // Do something before request is sent
//   console.log(config)
//   return config;
// }, function (error) {
//   // Do something with request error
//   return Promise.reject(error);
// });

// async function main() {
//   const salesloftUsers = await getUsers();
//   console.log(salesloftUsers);
//   const results = [];
//   const stream = fs.createReadStream("people.csv")
//     //   .pipe(stripBomStream())
//     .pipe(csv())
//     .on("data", async (row) => {
//       try {
//         stream.pause();
//         console.log("Salesloft ID:", row["salesloft_id"]);
//         let salesloft_id = row["salesloft_id"];
//         await updatePerson("https://api.salesloft.com/v2/people/", salesloft_id, {
//           person_stage_id: 17118
//         });
//         await getPersonCadences("https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=", salesloft_id);
//       } finally {
//         stream.resume();
//       }
//     })
//     .on("data", (data) => results.push(data))
//     .on("end", () => {
//       // console.log(results);
//       // console.log(results[0].salesloft_id);
//     });
// }

// main();

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

async function resetStatus() {
  let contacts = await getPeople('https://api.salesloft.com/v2/people.json', '2021-01-09T22:58:28.000Z');
  // console.log(contacts);

  contacts.forEach(contact => {
    console.log(contact.cadences);
    if(!contact.cadences.length) {
      console.log('No cadences, set to open');
    } else if(contact.cadences.length) {
      console.log('Contact has cadences');
      getCadences('https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=', contact.id);
    }
  });
}

// resetStatus();

async function getPeople(url, date) {
  // let date = '2020-08-09T22:58:28.000Z';
  let people = [];
  try {
    pages_params = {
      'include_paging_counts': true,
      'page': 1,
      'per_page': 50,
      'last_contacted[lt]': date,
      'person_stage_id': 17119,
      'sort_by': 'last_contacted_at',
      'sort_direction': 'DESC'  
    }
    let pages = await getTotalPages(url, pages_params);
    for (let page = 1; page <= pages; page++) {
      params = {
        'page': page,
        'per_page': 50,
        'last_contacted[lt]': date,
        'person_stage_id': 17119,
        'sort_by': 'last_contacted_at',
        'sort_direction': 'DESC'
      }
      let request = await axios.get(url, { params });
      // console.log(request.data.data);
      people.push(...request.data.data);
    }
    return people;
  } catch (error) {
    console.log(error);
  }
}

  async function getTotalPages(url, params) {
    try {
      let pageData = await axios.get(url, { params });
      let metaData = pageData.data.metadata;
      console.log(metaData);
      let totalPages = metaData.paging.total_pages;
      console.log('Total pages: ' + totalPages);
      return totalPages;
    } catch(error) {
      console.log(error);
    }
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

async function getCadences(uri, id) {
  cadenceList = [];
  try {
    let response = await axios.get(uri + id);
    let cadences = response.data.data;
    cadences.forEach(cadence => {
      cadenceList.push(cadence);
    });
    console.log(cadenceList);
    return cadenceList;
  } catch(error) {
    console.log(error);
  }
}

async function evaluateCadences() {
  cadences = await getCadences('https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=', 112676941)
  var today = new Date();
  var maxDays = 14;
  cadences.forEach(cadence => {
    let createdDate = new Date(cadence.created_at);
    let dateDifferential = dateDiffInDays(createdDate, today);
    console.log(dateDifferential);
    if(dateDifferential > maxDays) {
      console.log('Delete cadence');
      deletePersonCadence(cadence.id);
    } else {
      console.log(`Cadence created less than ${maxDays} days ago, dont't delete`);
    }
  })
}

evaluateCadences();

async function getPersonCadences(uri, id) {
  const request = await axios
    .get(uri + id, config)
    .then( async (res) => {
      // console.log(`statusCode: ${res.status}`);
      // console.log(res.data);
      let cadenceEnrollments = res.data;
      console.log(cadenceEnrollments);
      if (cadenceEnrollments['data'].length > 0) {
        for (const enrollment of cadenceEnrollments['data']) {
          let cadenceId = enrollment['id'];
          let cadenceState = enrollment['currently_on_cadence'];
          let cadenceEntryDate = new Date(enrollment['created_at']);
          let cadenceUser = enrollment['user'];
          console.log(cadenceUser);
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
  try {
    const request = await axios.delete(`https://api.salesloft.com/v2/cadence_memberships/${id}.json`);
    console.log(`StatusCode: ${request.status}`);
  } catch(error) {
    console.log(error);
  }
}

// async function getUserStatus(id) {
//   let status;
//   const request = await axios
//     .get(`https://api.salesloft.com/v2/users/${id}.json`, config)
//     .then((res) => {
//       // console.log(res.data);
//       if (res.data.data.active == false) {
//         console.log('User is inactive');
//         status = false;
//       } else if (res.data.data.active == true) {
//         console.log('User is active');
//         status = true
//       }
//     })
//     .catch((error) =>{
//       console.error(error);
//     })
//     console.log(status);
//     return status;
// }

// let userStatus = async (id) => {
//   uStatus = await getUserStatus(id);
//   console.log(uStatus);
// }

// userStatus(66217);

// async function getUsers() {
//   try {
//     const request = await axios
//     .get(`https://api.salesloft.com/v2/users.json`, config)
//     return request.data;
//   } catch (error) {
//     console.log(error);
//   }
// }

// let allUsers = async () => {
//   let userIds = [];

//   r = await getUsers();
//   console.log(r.data);


// };

// allUsers();

const _MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};