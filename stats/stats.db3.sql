BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "cards" (
	"snowflake"	INTEGER NOT NULL,
	"server"	TEXT NOT NULL,
	"user"		TEXT NOT NULL,
	"query" 	TEXT NOT NULL,
	"result" 	INTEGER NOT NULL,
	"mobile"	BOOLEAN NOT NULL,
	"lang1"		TEXT NOT NULL,
	"lang2"		TEXT NOT NULL,
	PRIMARY KEY("snowflake", "query")
);
CREATE TABLE IF NOT EXISTS "commands" (
	"snowflake"	INTEGER NOT NULL,
	"server"	TEXT NOT NULL,
	"user"		TEXT NOT NULL,
	"name" 		TEXT NOT NULL,
	"args" 		TEXT NOT NULL,
	PRIMARY KEY("snowflake")
);
COMMIT;