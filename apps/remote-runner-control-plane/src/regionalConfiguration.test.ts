import { describe, expect, it } from 'vitest';
import { readRemoteControlPlaneRegionalConfiguration } from './regionalConfiguration';

describe('Remote Control Plane regional configuration', () => {
  it('keeps regional mode disabled when every value is absent', () => {
    expect(readRemoteControlPlaneRegionalConfiguration({})).toBeUndefined();
  });

  it('fails closed on partial or malformed configuration', () => {
    expect(() =>
      readRemoteControlPlaneRegionalConfiguration({
        REMOTE_CONTROL_PLANE_REGION_ID: 'region-a',
      })
    ).toThrow(/requires deployment/u);
    expect(() =>
      readRemoteControlPlaneRegionalConfiguration({
        REMOTE_CONTROL_PLANE_DEPLOYMENT_ID: 'deployment/a',
        REMOTE_CONTROL_PLANE_REGION_ID: 'region-a',
        REMOTE_CONTROL_PLANE_INITIAL_ACTIVE_REGION_ID: 'region-a',
        REMOTE_CONTROL_PLANE_TRAFFIC_DATABASE_URL: 'postgres://authority',
      })
    ).toThrow(/deployment id/u);
  });

  it('normalizes one exact all-or-none regional configuration', () => {
    expect(
      readRemoteControlPlaneRegionalConfiguration({
        REMOTE_CONTROL_PLANE_DEPLOYMENT_ID: ' deployment-1 ',
        REMOTE_CONTROL_PLANE_REGION_ID: ' cn-a ',
        REMOTE_CONTROL_PLANE_INITIAL_ACTIVE_REGION_ID: ' cn-a ',
        REMOTE_CONTROL_PLANE_TRAFFIC_DATABASE_URL: ' postgres://authority ',
      })
    ).toEqual({
      deploymentId: 'deployment-1',
      regionId: 'cn-a',
      initialActiveRegionId: 'cn-a',
      databaseUrl: 'postgres://authority',
    });
  });
});
