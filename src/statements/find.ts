import { Statement } from "./statement";
import { Token } from "../tokens/";

export class Find extends Statement {

    public static match(tokens: Array<Token>): Statement {
        let str = Statement.concat(tokens).toUpperCase();
        if (/^FIND /.test(str)) {
            return new Find(tokens);
        }
        return undefined;
    }

}