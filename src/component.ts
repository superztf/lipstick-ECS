import { EntityAdmin, Entity } from "./EntityAdmin";
import { CLASS } from "./utils";

export class Component {
    protected m_entity: Entity = 0;

    public get entity(): Entity {
        return this.m_entity;
    }

    public GetSibling<T extends Component>(admin: EntityAdmin, cclass: CLASS<T>): T | undefined {
        return admin.GetComponentByEntity(this.m_entity, cclass);
    }

    public AddSibling(admin: EntityAdmin, ...cs: Component[]): void {
        admin.AssignComponents(this.m_entity, ...cs);
    }

    public RemoveSibling(admin: EntityAdmin, ...cs: Array<CLASS<Component>>): void {
        admin.RemoveComponents(this.m_entity, ...cs);
    }
}
