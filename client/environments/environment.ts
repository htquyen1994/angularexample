// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  name: 'dev',
  production: false,
  appInsights: {
    instrumentationKey: '6dc30831-0d5e-465f-814a-4ff34c183a66'
  },
  baseUrl: '/client/',
  enableHttpWorkers: false,
  mapId: '5432ae258b838e76'
};
