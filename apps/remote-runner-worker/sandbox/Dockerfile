ARG NODE_IMAGE
FROM ${NODE_IMAGE}

COPY apps/remote-runner-worker/sandbox/entry.mjs /opt/prodivix/sandbox-entry.mjs

ENV HOME=/tmp
WORKDIR /workspace
USER 65532:65532
ENTRYPOINT ["node", "/opt/prodivix/sandbox-entry.mjs"]
