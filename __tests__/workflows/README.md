# GitHub Actions Workflow Tests

이 디렉토리는 GitHub Actions workflow 파일의 구조와 유효성을 검증하는 테스트를 포함합니다.

## 테스트 파일

### build.test.ts

`build.yml` workflow 파일을 검증하는 테스트입니다.

#### 검증 항목

**1. Workflow File Structure**
- `.github/workflows/build.yml` 파일 존재 여부
- 유효한 YAML 구문
- workflow name 속성 존재

**2. Workflow Triggers**
- push 이벤트 트리거 설정
- main 브랜치 push 트리거
- Git 태그 push 트리거
- semantic versioning 태그 패턴

**3. Job Configuration**
- 최소 1개의 job 정의
- build job 존재
- build job의 이름
- ubuntu-24.04-arm runner 사용
- steps 배열 존재

**4. Build Job Steps**
- checkout step 존재 (actions/checkout)
- checkout@v4 이상 버전 사용
- Node.js setup step 존재 (actions/setup-node)
- Node.js 버전 20 사용
- 모든 step에 name 속성 존재

**5. ARM64 Architecture Configuration**
- ARM64 호환 runner 사용
- x86 특정 설정 미포함

**6. Workflow Best Practices**
- 의미있는 step 설명
- GitHub Actions 스키마 준수
- action 버전 고정 (pinned versions)

**7. Integration with Existing Workflows**
- test.yml과 일관된 구조
- 프로젝트 요구사항과 일치하는 Node.js 버전

**8. Workflow Syntax Validation**
- 실행 방해 구문 오류 없음
- 유효한 트리거 설정

## 실행 방법

```bash
# 워크플로우 테스트만 실행
npm run test:workflows

# 워크플로우 테스트 watch 모드
npm run test:workflows -- --watch

# 커버리지 포함
npm run test:workflows -- --coverage
```

## 테스트 실패 시나리오

다음과 같은 경우 테스트가 실패합니다:

1. `build.yml` 파일이 존재하지 않음
2. YAML 구문 오류
3. 필수 트리거가 누락됨 (main 브랜치, 태그)
4. ubuntu-24.04-arm runner를 사용하지 않음
5. Node.js 20을 사용하지 않음
6. actions/checkout@v4 미만 버전 사용
7. step에 name이 없음
8. x86 특정 설정 포함

## TDD Red Phase

현재 `build.yml` 파일이 생성되지 않았으므로 모든 테스트는 실패 상태입니다.
이는 TDD의 Red Phase로, 테스트가 먼저 작성되어 요구사항을 명확히 정의합니다.

다음 단계에서 구현을 완료하면 테스트가 통과할 것입니다 (Green Phase).
