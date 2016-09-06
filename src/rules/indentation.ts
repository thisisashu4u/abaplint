import {IRule} from "./rule";
import {File} from "../file";
import {Comment} from "../statements/statement";
import {IncludeType} from "../statements/include_type";
import Issue from "../issue";

export class IndentationConf {
  public enabled: boolean = true;
}

export class Indentation implements IRule {

  private conf = new IndentationConf();

  public getKey(): string {
    return "indentation";
  }

  public getDescription(): string {
    return "Bad indentation";
  }

  public getConfig() {
    return this.conf;
  }

  public setConfig(conf) {
    this.conf = conf;
  }

  public run(file: File) {

    let current = 0;
    let prev;

    for (let statement of file.getStatements()) {
      if (statement instanceof Comment
          || statement instanceof IncludeType) {
        continue;
      }

      current = current + statement.indentationStart(prev);
      if (statement.indentationSetStart() > -1) {
        current = statement.indentationSetStart();
      }

      let first = statement.getTokens()[0];

      if (first.getCol() !== current + 1) {
        file.add(new Issue(this, first.getPos(), file));
// one finding per file, pretty printer should fix everything?
        return;
      }

      current = current + statement.indentationEnd(prev);
      if (statement.indentationSetEnd() > -1) {
        current = statement.indentationSetEnd();
      }

      prev = statement;
    }
  }

}