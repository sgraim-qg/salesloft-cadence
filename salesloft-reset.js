// IF ADDED TO CADENCE LESS THAN 14 DAYS AGO DO NOT REMOVE DO NOT SET TO OPEN
// IF NOT CONTACTED > 30 DAYS AGO AND NOT ADDED TO CADENCE > 14 DAYS AGO SET TO OPEN AND REMOVE FROM CADENCES

// 9,448 People

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
// axios.interceptors.request.use(function (config) {
//     // Serialize the parameteters
//     config.paramsSerializer = params => queryString.stringify(params, { arrayFormat: 'brackets' })
//     return config
// });

async function main() {
    // Get the people we want to look at
    // people = await getPeople('https://api.salesloft.com/v2/people.json', '2022-08-01T22:58:28.000Z');

    people = await getPeople(
        'https://api.salesloft.com/v2/people.json',
        {
            'include_paging_counts': true,
            'per_page': 100,
            'owned_by_guid': '6c726a73-5938-4a42-a1b7-53aa1890c1f2',
            'last_contacted[lt]': '2022-09-28T00:00:00.000Z',
            // 'created_at[lt]': '2022-09-26T00:00:00.000Z',
            // 'created_at[gt]': '2020-08-16T22:58:28.000000Z',
            'person_stage_id': 17119,
            'sort_by': 'created_at',
            'sort_direction': 'ASC'
        }   
    );
    // console.log(people);

    for(const person of people) {
        if(!person.cadences.length) {
            // No cadences exist, set the person to open
            // console.log('No cadences, set to open');
            console.log(person.id);
            let update = await updatePerson("https://api.salesloft.com/v2/people/", person.id, {
                person_stage_id: 17118
            });
        } else if(person.cadences.length) {
            // Cadences exist, we need to check them before making changes

            // Get the person's cadence memberships
            let cadenceMemberships = await getCadences('https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=', person.id);
            console.log(cadenceMemberships);

            // Check that cadences weren't created less than 14 days ago
            let cadenceOutcomes = await evaluateCadences(cadenceMemberships);
            console.log('Cadence outcomes: ' + cadenceOutcomes);

            // If cadences we're created less than 14 days ago delete them and reset the person statsu to 'Open'
            if(cadenceOutcomes == true) {
                let update = await updatePerson("https://api.salesloft.com/v2/people/", person.id, {
                    person_stage_id: 17118
                });
            }
        }
    }

}

main();

async function neverContacted() {
    people = await getPeople('https://api.salesloft.com/v2/people.json', 
    {
        'include_paging_counts': true,
        'per_page': 100,
        'last_contacted': '_is_null',
        'created_at[lt]': '2021-08-16T22:58:28.000Z',
        // 'created_at[gt]': '2020-08-16T22:58:28.000000Z',
        'person_stage_id': 17119,
        'sort_by': 'created_at',
        'sort_direction': 'ASC'
    }
    );

    for(const person of people) {
        if(!person.cadences.length) {
            console.log(person.id);
            console.log(person.created_at);
            console.log(person.last_contacted_at);
            console.log(person.cadences);
            let update = await updatePerson("https://api.salesloft.com/v2/people/", person.id, {
                person_stage_id: 17118
            });
        }
        else if(person.cadences.length) {
            console.log(person.id);
            console.log(person.created_at);
            console.log(person.last_contacted_at);
            console.log(person.cadences);

            // Cadences exist, we need to check them before making changes

            // Get the person's cadence memberships
            let cadenceMemberships = await getCadences('https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=', person.id);
            console.log(cadenceMemberships);

            // Check that cadences weren't created less than 30 days ago
            let cadenceOutcomes = await evaluateCadences(cadenceMemberships);
            console.log('Cadence outcomes: ' + cadenceOutcomes);

            // If cadences we're created less than 30 days ago delete them and reset the person statsu to 'Open'
            if(cadenceOutcomes == true) {
                let update = await updatePerson("https://api.salesloft.com/v2/people/", person.id, {
                    person_stage_id: 17118
                });
            }
        }
    }
}

// neverContacted();

async function resetStatus(data) {
    //   let contacts = await getPeople('https://api.salesloft.com/v2/people.json', '2021-01-09T22:58:28.000Z');
    // console.log(contacts);

    data.forEach(contact => {
        console.log(contact.cadences);
        if (!contact.cadences.length) {
            //   console.log('No cadences, set to open');
        } else if (contact.cadences.length) {
            console.log('Contact has cadences');
            getCadences('https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=', contact.id);
        }
    });
}

async function getPeople(url, parameters) {
    let people = [];
    try {
        let pages_params = parameters;
        pages_params['page'] = 1;
        // console.log(pages_params);
        let pages = await getTotalPages(url, pages_params);
        // console.log(pages);
        for (let page = 1; page <= pages; page++) {
            let params = parameters;
            params['page'] = page;
            let request = await axios.get(url, { params });
            // console.log(request);
            people.push(...request.data.data);
        }
        return people;
    } catch (error) {
        console.log(error);
    }
}

var neverContacted = async() => {
    result = await getPeople(
        'https://api.salesloft.com/v2/people.json',
        {
            'include_paging_counts': true,
            'per_page': 100,
            'owned_by_guid': '89b2ea32-2b6a-4121-b796-8b6101ff6288',
            'last_contacted': '_is_null',
            'created_at[lt]': '2022-09-25T00:00:00.000Z',
            // 'created_at[gt]': '2020-08-16T22:58:28.000000Z',
            'person_stage_id': 17119,
            'sort_by': 'created_at',
            'sort_direction': 'ASC'
        }    
    );
}

// neverContacted();

// var contactedGt60 = async() => {
//     result = await getPeople(
//         'https://api.salesloft.com/v2/people.json',
//         {
//             'include_paging_counts': true,
//             'per_page': 100,
//             'owned_by_guid': '89b2ea32-2b6a-4121-b796-8b6101ff6288',
//             'last_contacted[lt]': '2022-08-31T00:00:00.000Z',
//             'created_at[lt]': '2022-09-25T00:00:00.000Z',
//             // 'created_at[gt]': '2020-08-16T22:58:28.000000Z',
//             'person_stage_id': 17119,
//             'sort_by': 'created_at',
//             'sort_direction': 'ASC'
//         }    
//     );
//     // console.log(result);
// }

// contactedGt60();

var contactedGt30 = async() => {
    result = await getPeople(
        'https://api.salesloft.com/v2/people.json',
        {
            'include_paging_counts': true,
            'per_page': 100,
            'owned_by_guid': '6c726a73-5938-4a42-a1b7-53aa1890c1f2',
            'last_contacted[lt]': '2022-09-28T00:00:00.000Z',
            // 'created_at[lt]': '2022-09-26T00:00:00.000Z',
            // 'created_at[gt]': '2020-08-16T22:58:28.000000Z',
            'person_stage_id': 17119,
            'sort_by': 'created_at',
            'sort_direction': 'ASC'
        }    
    );
    // console.log(result);
}

// contactedGt30();

async function getTotalPages(url, params) {
    try {
        let pageData = await axios.get(url, { params });
        let metaData = pageData.data.metadata;
        // console.log(pageData.data);
        console.log(metaData);
        let totalPages = metaData.paging.total_pages;
        // console.log('Total pages: ' + totalPages);
        return totalPages;
    } catch (error) {
        console.log(error);
    }
}

async function updatePerson(uri, id, details) {
    try {
        const request = await axios.put(uri + id, details);
        console.log(`Update status: ${request.status}`);
    } catch (error) {
        console.log(error);
    }
}

async function getCadences(uri, id) {
    cadenceList = [];
    try {
        let response = await axios.get(uri + id);
        let cadences = response.data.data;
        cadences.forEach(cadence => {
            cadenceList.push(cadence);
        });
        //   console.log(cadenceList);
        return cadenceList;
    } catch (error) {
        console.log(error);
    }
}

async function evaluateCadences(data) {
    let resetContactStatus = true;
    // cadences = await getCadences('https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=', 80682322)
    let allCadenceDateDiffs = [];
    let today = new Date();
    let maxDays = 38;
    data.forEach(cadence => {
        let createdDate = new Date(cadence.created_at);
        let dateDifferential = dateDiffInDays(createdDate, today);
        allCadenceDateDiffs.push(dateDifferential);
        // console.log(dateDifferential);
        if (dateDifferential > maxDays) {
            console.log('Delete cadence');
            deletePersonCadence(cadence.id);
        } else {
            console.log(`Cadence created less than ${maxDays} days ago, dont't delete`);
            resetContactStatus = false;
        }
    })
    console.log(allCadenceDateDiffs);
    if(allCadenceDateDiffs.some(diff => diff < maxDays)) {
        console.log('Some cadences less than ${maxDays} days old');
    }
    // console.log(resetContactStatus);
    return resetContactStatus;
}

// evaluateCadences();

async function deletePersonCadence(id) {
    try {
        const request = await axios.delete(`https://api.salesloft.com/v2/cadence_memberships/${id}.json`);
        console.log(`StatusCode: ${request.status}`);
    } catch (error) {
        console.log(error);
    }
}

const _MS_PER_DAY = 1000 * 60 * 60 * 24;

// a and b are javascript Date objects
function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};