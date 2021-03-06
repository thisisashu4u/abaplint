import {IRegistry} from "../../_iregistry";
import {BasicRuleConfig} from "../_basic_rule_config";
import {ABAPObject} from "../../objects/_abap_object";
import {IncludeGraph} from "../../utils/include_graph";
import {IRule} from "../_irule";
import {Issue} from "../../issue";
import {IObject} from "../../objects/_iobject";

export class CheckIncludeConf extends BasicRuleConfig {
}

export class CheckInclude implements IRule {

  private conf = new CheckIncludeConf();

  public getMetadata() {
    return {
      key: "check_include",
      title: "Check INCLUDEs",
      quickfix: false,
      shortDescription: `Checks INCLUDE statements`,
    };
  }

  public getConfig() {
    return this.conf;
  }

  public setConfig(conf: CheckIncludeConf) {
    this.conf = conf;
  }

  public run(obj: IObject, reg: IRegistry): readonly Issue[] {
    if (!(obj instanceof ABAPObject)) {
      return [];
    }

    let ret: Issue[] = [];
    const graph = new IncludeGraph(reg);
    for (const file of obj.getABAPFiles()) {
      ret = ret.concat(graph.getIssuesFile(file));
    }
    return ret;
  }

}