import {statementType} from "../utils";
import * as Statements from "../../src/abap/statements/";

let tests = [
  "INFOTYPES 1000.",
];

statementType(tests, "INFOTYPES", Statements.Infotypes);