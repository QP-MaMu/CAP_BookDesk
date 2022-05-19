const cds = require('@sap/cds')


module.exports = cds.service.impl(srv => {
    const { Booking } = srv.entities ('qpe.cloud')
    
    // Get date for today
    let today = new Date().toISOString().slice(0, 10)

    // Replace BookingToday Data with Bookings of today
    srv.on ('READ', 'BookingToday', () => SELECT.from(Booking).where({date: today}))
        

    srv.on ('readAvailableDesks', _readAvailableDesks)
    srv.on ('readDesksByString', _readDesksByString)
    srv.on ('readAvailableDesksByID', _readAvailableDesksByID)
    srv.on ('readDesksByID', _readDesksByID)
    srv.on ('bookTable', _bookTable)

    async function _readAvailableDesks (req) {
        const db = await cds.connect.to('db')
        const { Booking, Desk } = db.entities 

        let todaybookings
        let availableDesks
        let officeID

        // Select all available desks
        if (req.data.officeName === '*') {
            todaysBookings = SELECT `Desk_ID` .from `Booking` .where `date = ${req.data.date}`
            availableDesks = SELECT .from `Desk` .where `ID not in ${todaysBookings}`     
        }
        // Select available desk of a specific office
        else 
        {  
            officeID = SELECT `ID` .from `Office` .where `UPPER(name) = UPPER(${req.data.officeName})`
            todaysBookings = SELECT `Desk_ID` .from `Booking` .where `office_ID = ${officeID} and date = ${req.data.date}`
            availableDesks = SELECT .from `Desk` .where `office_ID = ${officeID} and ID not in ${todaysBookings}` 
        }
        
        // Execute query
        const Query = await cds.run(availableDesks)

        let array = []

        // Put results into array and return
        Query.forEach( item => {
            array.push(item)
        })
        
        return array
    }

    async function _readDesksByString (req) {
        const db = await cds.connect.to('db')
        const { Office, Desk } = db.entities 
        
        let officeID
        let desks
        var errorOccured = false

        /* Check user input */
        if (!req.data.officeName) {
            req.error(401, "Office is missing")
            errorOccured = true
        }

        // Select all desks for the office
        
        officeID = SELECT `ID` .from `Office` .where `UPPER(name) = UPPER(${req.data.officeName})`
        desks = SELECT .from `Desk` .where `office_ID = ${officeID}`  

        // Execute query
        const Query = await cds.run(desks)

        let array = []

        // Put results into array and return
        Query.forEach( item => {
            array.push(item)
        })
        
        return array 
    }

    async function _readAvailableDesksByID (req) {
        const db = await cds.connect.to('db')
        const { Booking, Desk } = db.entities 

        let todaybookings
        let availableDesks

        // Select all available desks
        if (!req.data.officeID) {
            todaysBookings = SELECT `Desk_ID` .from `Booking` .where `date = ${req.data.date}`
            availableDesks = SELECT .from `Desk` .where `ID not in ${todaysBookings}`     
        }
        // Select available desk of a specific office
        else 
        {  
            todaysBookings = SELECT `Desk_ID` .from `Booking` .where `office_ID = ${req.data.officeID} and date = ${req.data.date}`
            availableDesks = SELECT .from `Desk` .where `office_ID = ${req.data.officeID} and ID not in ${todaysBookings}` 
        }
        
        // Execute query
        const Query = await cds.run(availableDesks)

        let array = []

        // Put results into array and return
        Query.forEach( item => {
            array.push(item)
        })
        
        return array
    }

    async function _readDesksByID (req) {
        const db = await cds.connect.to('db')
        const { Office, Desk } = db.entities 
        
        let officeID
        let desks
        var errorOccured = false

        /* Check user input */
        if (!req.data.officeID) {
            req.error(401, "Office is missing")
            errorOccured = true
        }

        // Select all desks for the office
        desks = SELECT .from `Desk` .where `office_ID = ${req.data.officeID}`  

        // Execute query
        const Query = await cds.run(desks)

        let array = []

        // Put results into array and return
        Query.forEach( item => {
            array.push(item)
        })
        
        return array 
    }

    async function _bookTable (req) {
        const db = await cds.connect.to('db')
        const { Office, Booking, Desk } = db.entities 

        let userInput = req.data
        let message
        let errorOccured = false


        /* Check user input */
        if (!userInput.officeName) {
            req.error(401, "No office location in booking information found!")
            errorOccured = true
        } else {
            const officeID =  await SELECT.one `ID` .from `Office` .where `UPPER(name) = UPPER(${userInput.officeName})`
            userInput.office_ID = officeID.ID
            if (!userInput.office_ID) {
                req.error(401, "No office id for office name found!")
                errorOccured = true
            }
        }

        if (!userInput.deskName) {
            req.error(402, "No selected desk in booking information found!")
            errorOccured = true
        } else {
            const deskID =  await SELECT.one `ID` .from `Desk` .where `UPPER(name) = UPPER(${userInput.deskName})`
            userInput.desk_ID = deskID.ID
            if (!userInput.desk_ID) {
                req.error(401, "No desk id for desk name found!")
                errorOccured = true
            }
        }
        if (!userInput.user) {
            req.error(403, "No user in booking information found!")
            errorOccured = true
        }
        if (!userInput.date) {
            req.error(404, "No date in booking information found!")
            errorOccured = true
        }

        if (userInput.office_ID.toString().charAt(0) != userInput.desk_ID.toString().charAt(0)) {
            req.error(405, "Desk " + userInput.desk_ID + " does not belong to the office " + userInput.office_ID + "!")
            errorOccured = true
        }

        /* Check if table has been reserved already */
        if (errorOccured == false) {
            await cds.transaction(req).run(SELECT.from(Booking).where({desk_ID:userInput.desk_ID, date:userInput.date})).then(
            all => all.forEach ((hasBookedDesk,i) => {
                if (hasBookedDesk) {
                    req.error(408, "Desk " + userInput.desk_ID + " is already booked by " + hasBookedDesk.user + "!")
                    errorOccured = true;
                }
            }))
        }
        
        /* Check if the user already booked for this day */
        if (errorOccured == false) {
            await cds.transaction(req).run(SELECT.from(Booking).where({user:userInput.user, date:userInput.date}) ).then(
                all => all.forEach ((userHasAlreadyBooked,i) => {
                if (userHasAlreadyBooked) {
                    req.error (409, "You already booked a table for the " + userInput.date + "!")
                }
                }) 
            )
        }        

        /* Book Table */
        if (errorOccured == false) {
            req.user.id = userInput.user;
            await cds.transaction(req).run(INSERT.into (Booking, { office_ID:userInput.office_ID, desk_ID:userInput.desk_ID, user:userInput.user, date:userInput.date}))
            message = "Desk " + userInput.deskName + " for " + userInput.user + " successfully booked for " + userInput.date + "." 
        }
        return message
    }
}) 