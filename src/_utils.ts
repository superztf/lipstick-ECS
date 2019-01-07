export function throwError(errmsg: string) {
    throw (new Error(`ECS-ERROR: ${errmsg}`));
}
