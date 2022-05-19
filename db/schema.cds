namespace qpe.cloud;
using { cuid, managed }from '@sap/cds/common';

    entity Office {
        Key ID : Integer    @title:'Office ID';
        name : String       @title:'Name';
        street : String     @title:'Street';
        town : String       @title:'Town';
        country : String    @title:'Country';
        desks : Association to many Desk on desks.office = $self;
    }
    
    entity Desk {
        Key ID : Integer                    @title:'Desk ID';
        office : Association to Office;     
        name : String                       @title:'Name';
        bookings : Association to many Booking on bookings.desk = $self 
    }

    entity Booking : managed, cuid {
        office : Association to Office;
        desk : Association to Desk;
        user : String   @title:'User';
        date : Date     @title:'Date';
    }