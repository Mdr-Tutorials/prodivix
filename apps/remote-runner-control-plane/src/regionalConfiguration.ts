export type RemoteControlPlaneRegionalConfiguration = Readonly<{
  deploymentId: string;
  regionId: string;
  initialActiveRegionId: string;
  databaseUrl: string;
}>;

const identifier = (value: string, label: string, maximum: number): string => {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > maximum ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(normalized)
  )
    throw new TypeError(`${label} is invalid.`);
  return normalized;
};

/** Regional mode is an all-or-none production boundary; partial setup never degrades to single-region writes. */
export const readRemoteControlPlaneRegionalConfiguration = (
  environment: Readonly<Record<string, string | undefined>>
): RemoteControlPlaneRegionalConfiguration | undefined => {
  const values = {
    deploymentId: environment.REMOTE_CONTROL_PLANE_DEPLOYMENT_ID?.trim(),
    regionId: environment.REMOTE_CONTROL_PLANE_REGION_ID?.trim(),
    initialActiveRegionId:
      environment.REMOTE_CONTROL_PLANE_INITIAL_ACTIVE_REGION_ID?.trim(),
    databaseUrl: environment.REMOTE_CONTROL_PLANE_TRAFFIC_DATABASE_URL?.trim(),
  };
  const configured = Object.values(values).filter(Boolean).length;
  if (configured === 0) return undefined;
  if (configured !== 4)
    throw new TypeError(
      'Regional Control Plane requires deployment, region, initial active region, and traffic database configuration together.'
    );
  if (values.databaseUrl!.length > 8_192)
    throw new TypeError('Remote regional traffic database URL is invalid.');
  return Object.freeze({
    deploymentId: identifier(
      values.deploymentId!,
      'Remote regional deployment id',
      256
    ),
    regionId: identifier(values.regionId!, 'Remote regional region id', 128),
    initialActiveRegionId: identifier(
      values.initialActiveRegionId!,
      'Remote regional initial active region id',
      128
    ),
    databaseUrl: values.databaseUrl!,
  });
};
