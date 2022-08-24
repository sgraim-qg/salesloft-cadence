const results = [];
fs.createReadStream("people.csv")
  .pipe(csv())
  .on("data", (row) => {
    console.log(row);
    let sl_id = row["SalesLoft ID"];
    console.log("ID: " + sl_id);
    // updatePerson("https://api.salesloft.com/v2/people/", 33910951, { person_stage_id: 17118 });
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });



// test it
const a = new Date("2021-09-28"),
    b = new Date("2022-03-28"),
    difference = dateDiffInDays(a, b);
    console.log(difference);

getPersonCadences("https://api.salesloft.com/v2/cadence_memberships.json?person_id=" + "37333435");
 
getPersonCadences("https://api.salesloft.com/v2/cadence_memberships.json?currently_on_cadence=true&person_id=" + "37333435");

deletePersonCadence(146990802);

updatePerson("https://api.salesloft.com/v2/people/", 33910951, { person_stage_id: 17118 });

getPerson("https://api.salesloft.com/v2/people/", 33910951);
updateDetailsDocument(
    {
        stage: 'Open'
    }
);


