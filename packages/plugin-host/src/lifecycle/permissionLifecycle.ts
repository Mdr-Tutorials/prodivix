import {
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import { isCapabilityGranted } from '#host/capability/permissionSnapshot';
import { pluginOwnerKey } from '#host/identity';
import {
  disposePreparedContributions,
  stagePreparedContributions,
} from '#host/lifecycle/hostContributionOperations';
import {
  hasErrorDiagnostic,
  operationFailure,
  type PluginHostContext,
} from '#host/lifecycle/pluginHostContext';
import type { PluginHost } from '#host/lifecycle/pluginHost';
import type { HostContributionPointMap } from '#host/contribution/contribution.types';
import { pluginHostSuccess } from '#host/result';

export const createPermissionLifecycle = <
  TMap extends HostContributionPointMap,
>(
  context: PluginHostContext<TMap>
): Readonly<{
  reconcilePermissions: PluginHost<TMap>['reconcilePermissions'];
}> => {
  const reconcilePermissions: PluginHost<TMap>['reconcilePermissions'] = (
    pluginId
  ) => {
    context.supersedeOperation(pluginId);
    return context.coordinator.run(pluginId, async () => {
      const record = context.records.get(pluginId);
      if (!record) {
        return context.invalidOperation(pluginId, 'Plugin is not discovered.');
      }
      if (!record.permission) {
        return context.invalidOperation(
          pluginId,
          'Plugin has no permission state to reconcile.',
          record
        );
      }
      const operation = context.beginOperation(record.owner, 'reconcile');
      const previousPermission = record.permission;
      const diagnostics: PluginDiagnostic[] = [];
      try {
        const permissionResult = await context.resolveRecordPermission(
          record,
          operation,
          previousPermission
        );
        if (!permissionResult.ok) {
          diagnostics.push(...permissionResult.diagnostics);
          context.publishSnapshot(record, {
            availability: 'failed',
            diagnostics,
          });
          return operationFailure(diagnostics);
        }
        record.permission = permissionResult.value;
        context.permissionsByOwner.set(
          pluginOwnerKey(record.owner),
          record.permission
        );
        context.notifyPermissionChanged(record.owner);
        diagnostics.push(...permissionResult.diagnostics);

        if (record.permission.deniedRequired.length > 0) {
          diagnostics.push(
            ...(await context.cleanupRecord(
              record,
              operation.operationId,
              'permission-revoked',
              true
            ))
          );
          const failed = hasErrorDiagnostic(
            diagnostics.filter(
              (diagnostic) =>
                diagnostic.code !==
                PLUGIN_DIAGNOSTIC_CODES.REQUIRED_CAPABILITY_DENIED
            )
          );
          diagnostics.push(
            ...context.publishSnapshot(record, {
              availability: failed ? 'failed' : 'blocked',
              runtime: record.manifest.entrypoints?.runtime
                ? failed
                  ? 'failed'
                  : 'inactive'
                : 'not-applicable',
              diagnostics,
            })
          );
          diagnostics.push(
            ...(await context.appendAudit(
              record,
              operation.operationId,
              'permission',
              'reconcile',
              failed ? 'failed' : 'denied',
              diagnostics
            ))
          );
          return failed
            ? operationFailure(diagnostics)
            : pluginHostSuccess(record.snapshot, diagnostics);
        }

        const revoked = previousPermission.granted.filter(
          (capability) => !isCapabilityGranted(record.permission!, capability)
        );
        if (revoked.length > 0) {
          const cleanup = await context.registry.disposeByCapabilities(
            record.owner,
            revoked,
            operation.operationId
          );
          diagnostics.push(...cleanup.diagnostics);
        }
        const preparedResult = await context.prepareRecordPackage(
          record,
          operation
        );
        if (!preparedResult.ok) {
          diagnostics.push(...preparedResult.diagnostics);
          diagnostics.push(
            ...(await context.cleanupRecord(
              record,
              operation.operationId,
              'permission-revoked',
              true
            ))
          );
          context.publishSnapshot(record, {
            availability: 'failed',
            runtime: record.manifest.entrypoints?.runtime
              ? 'failed'
              : 'not-applicable',
            diagnostics,
          });
          return operationFailure(diagnostics);
        }
        diagnostics.push(...preparedResult.diagnostics);
        const transaction = context.registry.beginTransaction({
          owner: record.owner,
          expectedRegistryRevision: context.registry.getRevision(),
          expectedPermissionRevision: record.permission.permissionRevision,
          lifetime: 'installation',
          operationId: operation.operationId,
          replaceOwner: record.owner,
        });
        const staged = await stagePreparedContributions(
          transaction,
          record.owner,
          preparedResult.value.installation,
          operation.operationId,
          'installation'
        );
        if (!staged.ok) {
          diagnostics.push(...staged.diagnostics);
          diagnostics.push(
            ...(await disposePreparedContributions(
              preparedResult.value.activation,
              record.owner,
              operation.operationId
            ))
          );
          context.publishSnapshot(record, {
            availability: 'failed',
            diagnostics,
          });
          return operationFailure(diagnostics);
        }
        const committed = await transaction.commit();
        diagnostics.push(...committed.diagnostics);
        if (!committed.ok) {
          diagnostics.push(
            ...(await disposePreparedContributions(
              preparedResult.value.activation,
              record.owner,
              operation.operationId
            ))
          );
          context.publishSnapshot(record, {
            availability: 'failed',
            diagnostics,
          });
          return operationFailure(diagnostics);
        }
        diagnostics.push(
          ...(await context.disposePendingActivation(
            record,
            operation.operationId
          ))
        );
        record.descriptors = preparedResult.value.descriptors;
        record.pendingActivation = preparedResult.value.activation;
        record.activationContributionIds = new Set(
          preparedResult.value.activation.map((entry) => entry.declaration.id)
        );
        diagnostics.push(
          ...context.publishSnapshot(record, {
            availability: 'ready',
            diagnostics,
          })
        );
        diagnostics.push(
          ...(await context.appendAudit(
            record,
            operation.operationId,
            'permission',
            'reconcile',
            'success',
            diagnostics
          ))
        );
        return pluginHostSuccess(record.snapshot, diagnostics);
      } finally {
        context.endOperation(operation);
      }
    });
  };

  return Object.freeze({ reconcilePermissions });
};
