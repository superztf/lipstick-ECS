import { EntityAdmin, Entity } from "./EntityAdmin";

export class Component {
    protected m_entity: Entity = 0;

    public get entity(): Entity {
        return this.m_entity;
    }

    public Sibling<T extends Component>(admin: EntityAdmin, cclass: new () => T): T | undefined {
        return admin.GetComponentByEntity(this.m_entity, cclass);
    }
}