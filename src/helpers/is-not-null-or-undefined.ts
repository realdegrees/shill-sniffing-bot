export default <T extends Object>(input: null | undefined | T): input is T => input != null;
