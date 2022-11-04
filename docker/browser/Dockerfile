FROM public.ecr.aws/lambda/nodejs:16

ARG LAMBDA_TASK_ROOT="/app"
ENV PLAYWRIGHT_BROWSERS_PATH=0

RUN npm install -g yarn
RUN yum install -y \
  atk cups-libs libdrm dbus-libs at-spi2-core \
  libX11 libXcomposite libXdamage libXext libXfixes libXrandr mesa-libgbm libxcb libxkbcommon \
  pango cairo alsa-lib libwayland-client

# Source App
WORKDIR ${LAMBDA_TASK_ROOT}
COPY package.json ${LAMBDA_TASK_ROOT}
COPY yarn.lock ${LAMBDA_TASK_ROOT}
COPY src/ ${LAMBDA_TASK_ROOT}/src
COPY node_modules ${LAMBDA_TASK_ROOT}/node_modules

# Browser
RUN yarn playwright install chromium

CMD ["index.handler"]
