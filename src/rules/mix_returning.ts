import {Issue} from "../issue";
import {ABAPRule} from "./_abap_rule";
import {ABAPFile} from "../files";
import * as Statements from "../abap/statements";
import * as Expressions from "../abap/expressions";


export class MixReturningConf {
  public enabled: boolean = true;
}

export class MixReturning extends ABAPRule {

  private conf = new MixReturningConf();

  public getKey(): string {
    return "mix_returning";
  }

  public getDescription(): string {
    return "Mixing RETURNING and EXPORTING/CHANGING";
  }

  public getConfig() {
    return this.conf;
  }

  public setConfig(conf: MixReturningConf) {
    this.conf = conf;
  }

  public runParsed(file: ABAPFile): Issue[] {
    let ret: Issue[] = [];

    if (file.getStructure() == undefined) {
      return [];
    }

    for (let def of file.getStructure().findAllStatements(Statements.MethodDef)) {
      if (!def.findFirstExpression(Expressions.MethodDefReturning)) {
        continue;
      }
      if (def.findFirstExpression(Expressions.MethodDefExporting)
          || def.findFirstExpression(Expressions.MethodDefChanging)) {
        const token = def.getFirstToken().get();
        ret.push(new Issue({file, message: this.getDescription(), start: token.getPos()}));
      }
    }

    return ret;
  }

}
