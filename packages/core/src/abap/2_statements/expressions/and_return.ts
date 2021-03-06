import {str, Expression} from "../combi";
import {IStatementRunnable} from "../statement_runnable";

export class AndReturn extends Expression {
  public getRunnable(): IStatementRunnable {
    return str("AND RETURN");
  }
}