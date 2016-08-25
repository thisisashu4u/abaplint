import {statementType} from "../utils";
import * as Statements from "../../src/statements/";

let tests = [
  "INSERT tactz FROM TABLE lt_tactz.",
  "INSERT zfoo.",
  "INSERT INTO zuser VALUES ls_user.",
  "INSERT (c_tabname) FROM ls_table.",
];

statementType(tests, "INSERT", Statements.InsertDatabase);