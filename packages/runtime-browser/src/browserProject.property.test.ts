import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  createBrowserProjectFileTree,
  createBrowserProjectSnapshot,
} from './browserProject';

const segmentArbitrary = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), {
    minLength: 1,
    maxLength: 10,
  })
  .map((characters) => characters.join(''));

describe('browser project properties', () => {
  it('materializes every normalized flat file exactly once', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(segmentArbitrary, fc.string()), {
          minLength: 1,
          maxLength: 30,
        }),
        (entries) => {
          const files = entries.map(([directory, contents], index) => ({
            path: `root-${index}/${directory}/file-${index}.txt`,
            contents,
          }));
          const snapshot = createBrowserProjectSnapshot({
            workspaceId: 'workspace',
            snapshotId: 'snapshot',
            files,
          });
          const tree = createBrowserProjectFileTree(snapshot.files);

          expect(snapshot.files.map((file) => file.path)).toEqual(
            [...files.map((file) => file.path)].sort((left, right) =>
              left.localeCompare(right)
            )
          );
          snapshot.files.forEach((file) => {
            const [root, directory, name] = file.path.split('/');
            const rootNode = tree[root];
            expect(rootNode && 'directory' in rootNode).toBe(true);
            const directoryNode =
              rootNode && 'directory' in rootNode
                ? rootNode.directory[directory]
                : undefined;
            expect(directoryNode && 'directory' in directoryNode).toBe(true);
            const fileNode =
              directoryNode && 'directory' in directoryNode
                ? directoryNode.directory[name]
                : undefined;
            expect(fileNode && 'file' in fileNode).toBe(true);
            if (fileNode && 'file' in fileNode) {
              expect(fileNode.file.contents).toEqual(file.contents);
            }
          });
        }
      )
    );
  });

  it('rejects a path that is both a file and a directory', () => {
    fc.assert(
      fc.property(segmentArbitrary, (segment) => {
        expect(() =>
          createBrowserProjectSnapshot({
            workspaceId: 'workspace',
            snapshotId: 'snapshot',
            files: [
              { path: segment, contents: 'file' },
              { path: `${segment}/child.ts`, contents: 'child' },
            ],
          })
        ).toThrow(/both a file and a directory/);
      })
    );
  });
});
