CREATE TABLE rice_categories (
    id SERIAL PRIMARY KEY,
    data TEXT,
    image BYTEA,
    filename TEXT,
    date TIMESTAMP
);

select * from rice_categories;

drop table rice_categories;

delete from rice_categories where id is not null;