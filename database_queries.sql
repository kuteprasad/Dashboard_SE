CREATE TABLE IF NOT EXISTS seat_data (
    id SERIAL PRIMARY KEY,
    college VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    seat_type VARCHAR(10) CHECK (seat_type IN ('NRI', 'OCI', 'FN', 'PIO', 'CIWGC')) NOT NULL,
    intake INTEGER NOT NULL,
    filled INTEGER NOT NULL,
    vacant INTEGER NOT NULL
);


INSERT INTO seat_data (college, branch, seat_type, intake, filled, vacant)
VALUES
    ('VU', 'Computer Science', 'NRI', 50, 30, 20),
    ('VU', 'Electrical Engineering', 'OCI', 40, 20, 20),
    ('VU', 'Mechanical Engineering', 'FN', 60, 45, 15);

