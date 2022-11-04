FROM public.ecr.aws/lambda/nodejs:16

ARG LAMBDA_TASK_ROOT="/app"
ENV PLAYWRIGHT_BROWSERS_PATH=0

RUN npm install -g yarn

# Source App
WORKDIR ${LAMBDA_TASK_ROOT}
COPY package.json ${LAMBDA_TASK_ROOT}
COPY yarn.lock ${LAMBDA_TASK_ROOT}
COPY src ${LAMBDA_TASK_ROOT}
COPY node_modules ${LAMBDA_TASK_ROOT}

# Browser
RUN yarn playwright install chromium

CMD ["index.handler"]
