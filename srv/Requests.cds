using qpe.cloud from '../db/schema';

service Request {
    @readonly entity BookingToday as projection on cloud.Booking excluding {
        createdAt, createdBy, modifiedAt, modifiedBy
    };
    
    function readAvailableDesks (officeName:String,date:Date) returns array of String;
    function readDesksByString (officeName:String) returns array of String;
    function bookTable(officeName:String,deskName:String,user:String,date:Date) returns String;
    function readAvailableDesksByID (officeID:Integer,date:Date) returns array of String;
    function readDesksByID (officeID:Integer) returns array of String;

}