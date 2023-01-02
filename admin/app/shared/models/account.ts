export interface IAccount {
  username: string;
  email: string;
  forename: string;
  surname: string;
  membershipLevel: string;
  isSuperUser: boolean;
  isTenantAdmin: boolean;
  fullName: string;
  userType: string;
  permissionUrls: IPermissionUrl[];
  tenantId: string;
}

export interface IPermissionUrl {
  url: string;
  menuText: string;
}

export class Account implements IAccount {
  private static permissionUrl: { [key: string]: IPermissionUrl[] } = {
    superUser: [
      { url: 'tenants', menuText: 'Tenants' },
      { url: 'users', menuText: 'Users' },
      { url: 'permissions', menuText: 'Data Permissions' },
      { url: 'data', menuText: 'Data Catalog' },
      { url: 'reports', menuText: 'Reports' },
      { url: 'functionality', menuText: 'Functionality User Groups' }],
    tenantAdmin: [{ url: 'users', menuText: 'Users' }, { url: 'permissions', menuText: 'Data Permissions' }]
  };
  username: string;
  email: string;
  forename: string = '';
  surname: string = '';
  membershipLevel: string;
  isSuperUser: boolean;
  isTenantAdmin: boolean;
  permissionUrls: IPermissionUrl[];
  fullName: string;
  userType: string;
  tenantId: string;

  constructor();
  constructor(account: IAccount);
  constructor(account?: IAccount) {
    if (account) {
      const { username, email, forename, surname, membershipLevel, isSuperUser, isTenantAdmin, tenantId } = account;
      this.username = username;
      this.email = email;
      this.forename = forename;
      this.surname = surname;
      this.membershipLevel = membershipLevel;
      this.isSuperUser = isSuperUser;
      this.isTenantAdmin = isTenantAdmin;
      this.fullName = this.forename + ' ' + this.surname;
      this.userType = `${this.membershipLevel} ${this.isSuperUser? '(Super User)' : '(Tenant Admin)'}`;
      this.tenantId = tenantId;
      if (isSuperUser) {
        this.permissionUrls = Account.permissionUrl['superUser'];
      } else if (isTenantAdmin) {
        this.permissionUrls = Account.permissionUrl['tenantAdmin'];
      }
    }
  }
}


