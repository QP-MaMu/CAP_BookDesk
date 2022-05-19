const cds = require('@sap/cds')

const User = new class extends cds.User {}

module.exports = cds.service.impl(srv => {
    const { Booking } = srv.entities ('qpe.cloud')

    srv.before ('CREATE', 'Booking', _checkUserBooking)
    srv.before ('CREATE', 'Booking', _setUser)


    async function _setUser (req) {
        const userInput = req.data

        req.user.id = userInput.user;
    }


    async function _checkUserBooking (req) {
        const userInput = req.data
        var errorOccured = false

        /* Format user input (from names to IDs) */


        /* Check user input */
        if (!userInput.office_ID) {
            req.error(401, "No office location in booking information found!")
            errorOccured = true
        }
        if (!userInput.desk_ID) {
            req.error(402, "No selected desk in booking information found!")
            errorOccured = true
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
    }
}) 