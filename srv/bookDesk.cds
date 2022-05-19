using qpe.cloud from '../db/schema';

service BookDesk {
    @readonly entity Office as projection on cloud.Office;
    @readonly entity Desk as projection on cloud.Desk;
    entity Booking as projection on cloud.Booking order by date asc;
}
