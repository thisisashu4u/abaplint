import {ABAPObject} from "./_abap_object";
import {IInterfaceDefinition} from "../abap/types/_interface_definition";

export class Interface extends ABAPObject {
  private def: IInterfaceDefinition | undefined;

  public getType(): string {
    return "INTF";
  }

  public setDefinition(def: IInterfaceDefinition | undefined): void {
    this.def = def;
  }

  public getDefinition(): IInterfaceDefinition | undefined {
    return this.def;
  }

  public getAllowedNaming() {
    return {
      maxLength: 30,
      allowNamespace: true,
    };
  }

  public getDescription(): string | undefined {
    const xml = this.getXML();
    if (!xml) {
      return undefined;
    }
    const parsed = this.parseXML();
    if (parsed.abapGit["asx:abap"]["asx:values"] === undefined) {
      return undefined;
    }
    const vseo = parsed.abapGit["asx:abap"]["asx:values"].VSEOINTERF;
    return vseo.DESCRIPT ? vseo.DESCRIPT._text : "";
  }

// todo, should this method be moved to abstract class ABAPObject?
  public isGeneratedProxy(): boolean {
    const xml = this.getXML();
    if (!xml) {
      return false;
    }
    const result = xml.match(/<CLSPROXY>(.)<\/CLSPROXY>/);
    if (result) {
      return true;
    } else {
      return false;
    }
  }

}