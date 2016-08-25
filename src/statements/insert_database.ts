import { Statement } from "./statement";
import Reuse from "./reuse";
import * as Combi from "../combi";

let str = Combi.str;
let seq = Combi.seq;
let alt = Combi.alt;
let opt = Combi.opt;

export class InsertDatabase extends Statement {

  public static get_matcher(): Combi.IRunnable {
    let target = alt(Reuse.source(), Reuse.dynamic());

    let from = seq(target,
                   opt(seq(str("FROM"),
                           opt(str("TABLE")),
                           Reuse.source())));

    let into = seq(str("INTO"), target, str("VALUES"), Reuse.source());

    return seq(str("INSERT"), alt(from, into));
  }

}