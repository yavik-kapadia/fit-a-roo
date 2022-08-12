create table if not exists exercises
(
    bodyPart  text null,
    equipment text null,
    gifUrl    text null,
    id        int  not null
        primary key,
    name      text null,
    target    text null
);

create table if not exists profile
(
    userId    int auto_increment
        primary key,
    firstName varchar(25) not null,
    LastName  varchar(25) not null,
    dob       datetime    not null,
    email     varchar(25) not null,
    password  varchar(72) not null,
    goals     varchar(25) not null,
    lastLogin varchar(25) null
);

create table if not exists workout
(
    sessionId int auto_increment
        primary key,
    userId    int                                  not null,
    endTime   timestamp                            not null on update CURRENT_TIMESTAMP,
    startTime timestamp  default CURRENT_TIMESTAMP not null,
    status    tinyint(1) default 0                 not null,
    constraint workout_ibfk_1
        foreign key (userId) references profile (userId)
);

create table if not exists routine
(
    setId      int auto_increment
        primary key,
    sessionId  int           not null,
    userId     int           not null,
    exerciseId int           not null,
    weight     float         not null,
    reps       int default 0 not null,
    constraint exerciseId
        foreign key (exerciseId) references exercises (id),
    constraint sessionId
        foreign key (sessionId) references workout (sessionId),
    constraint userId
        foreign key (userId) references profile (userId)
);

create index userId
    on workout (userId);


